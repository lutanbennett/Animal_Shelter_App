import Link from "next/link";
import { BackLink } from "@/components/BackLink";
import { getT } from "@/lib/i18n/get-t";
import { requirePermission } from "@/lib/permissions/require";
import { driveImageUrl, isMedicalFolder } from "@/lib/google/drive-client";
import { resolveSource } from "@/lib/memes/source-server";
import { isSourceKind, sourcesFor, type SourceKind } from "@/lib/memes/sources";
import { MemeMaker } from "./MemeMaker";
import { ResidentSearch } from "./ResidentSearch";
import { UploadPicker } from "./UploadPicker";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FILE_ID = /^[A-Za-z0-9_-]{10,100}$/;
const IMAGE_NAME = /\.(jpe?g|png|webp)$/i;
const LIST_LIMIT = 90;

type Thumb = { drive_file_id: string; file_name: string | null };

/**
 * The meme maker (stage 2 of the library, widened to any photo). `?source=` picks a tab (residents by default);
 * `?photo=<drive file id>` opens the maker on that photo; `?resident=<id>` lists one resident's photos. A tab is
 * offered only to a login that may open the page those photos live on (sourcesFor), and the photo is checked again
 * here and at the save (resolveSource), so the page is a convenience and not the rule. Medical photos are never a
 * source. docs/decisions/2026-10-19-meme-maker.md, 2026-10-19-meme-sources-app.md.
 */
export default async function MakeMemePage(props: PageProps<"/memes/make">) {
  const { photo, resident, source: sourceParam } = await props.searchParams;
  const photoId = typeof photo === "string" ? photo : "";
  const residentId = typeof resident === "string" ? resident : "";
  const { supabase, perms } = await requirePermission("social.library");
  const { t, locale } = await getT();
  const m = t.memes.maker;

  const offered = sourcesFor(perms);
  const kind: SourceKind = isSourceKind(sourceParam) && offered.includes(sourceParam) ? sourceParam : "resident";

  const shell = (body: React.ReactNode, showTabs = true) => (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <BackLink href="/memes">{m.back}</BackLink>
      <h1 className="text-2xl font-semibold text-foreground">{m.title}</h1>
      {showTabs && (
        <nav aria-label={m.sourcesLabel} className="flex flex-wrap gap-2">
          {offered.map((k) => (
            <Link
              key={k}
              href={k === "resident" ? "/memes/make" : `/memes/make?source=${k}`}
              aria-current={k === kind ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded border px-3 py-2 text-sm font-medium ${
                k === kind ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:bg-surface-hover"
              }`}
            >
              {m.sources[k]}
            </Link>
          ))}
        </nav>
      )}
      {body}
    </main>
  );

  if (photoId) {
    if (kind === "upload" || !FILE_ID.test(photoId)) return shell(<p role="alert" className="text-base text-danger">{m.refused}</p>, false);
    const source = await resolveSource(supabase, perms, kind, photoId);
    if (!source.ok) return shell(<p role="alert" className="text-base text-danger">{m.refused}</p>, false);
    let label = "";
    if (source.residentIds.length > 0) {
      const { data: names } = await supabase
        .from("resident_list_view")
        .select("name")
        .in("resident_id", source.residentIds)
        .returns<{ name: string }[]>();
      label = (names ?? []).map((n) => n.name).join(", ");
    }
    return shell(
      <MemeMaker photoSrc={driveImageUrl(photoId, 1200)} sourceKind={kind} sourceFileId={photoId} residentLabel={label} />,
      false,
    );
  }

  const grid = (photos: Thumb[]) => {
    const usable = photos.filter((p) => !p.file_name || IMAGE_NAME.test(p.file_name));
    if (usable.length === 0) return <p className="text-base text-muted">{m.noSourcePhotos}</p>;
    return (
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {usable.map((p) => (
          <li key={p.drive_file_id}>
            <Link href={`/memes/make?source=${kind}&photo=${p.drive_file_id}`} className="block overflow-hidden rounded border border-border">
              <img src={driveImageUrl(p.drive_file_id, 400)} alt={p.file_name ?? ""} className="aspect-square w-full object-cover" />
            </Link>
          </li>
        ))}
      </ul>
    );
  };

  if (kind === "upload") return shell(<UploadPicker />);

  if (kind === "outing") {
    const { data } = await supabase
      .from("community_outing_photos")
      .select("drive_file_id, file_name")
      .order("uploaded_at", { ascending: false })
      .limit(LIST_LIMIT)
      .returns<Thumb[]>();
    return shell(grid(data ?? []));
  }
  if (kind === "maintenance" || kind === "project") {
    const { data } = await supabase
      .from("attachments")
      .select("drive_file_id, file_name, sub_folder")
      .eq("owner_type", kind)
      .order("uploaded_at", { ascending: false })
      .limit(LIST_LIMIT)
      .returns<(Thumb & { sub_folder: string | null })[]>();
    return shell(grid((data ?? []).filter((p) => !isMedicalFolder(p.sub_folder))));
  }
  if (kind === "website") {
    const { data } = await supabase
      .from("site_content_photos")
      .select("drive_file_id")
      .order("sort_order")
      .limit(LIST_LIMIT)
      .returns<{ drive_file_id: string }[]>();
    return shell(grid((data ?? []).map((p) => ({ ...p, file_name: null }))));
  }

  if (residentId && UUID.test(residentId)) {
    const [{ data: photos }, { data: who }] = await Promise.all([
      supabase
        .from("attachments")
        .select("drive_file_id, file_name, sub_folder, approved_at")
        .eq("owner_type", "resident")
        .eq("owner_id", residentId)
        .not("approved_at", "is", null)
        .order("uploaded_at", { ascending: false })
        .returns<{ drive_file_id: string; file_name: string | null; sub_folder: string | null }[]>(),
      supabase.from("resident_list_view").select("name").eq("resident_id", residentId).returns<{ name: string }[]>(),
    ]);
    const usable = (photos ?? []).filter((p) => !isMedicalFolder(p.sub_folder) && IMAGE_NAME.test(p.file_name ?? ""));
    return shell(
      <>
        <h2 className="text-lg font-semibold text-foreground">{m.pickPhoto(who?.[0]?.name ?? "")}</h2>
        {usable.length === 0 ? <p className="text-base text-muted">{m.noPhotos}</p> : grid(usable)}
      </>,
    );
  }

  const [{ data: residents }, { data: profiles }, { data: recent }] = await Promise.all([
    supabase
      .from("resident_list_view")
      .select("resident_id, name, thai_name, resident_code, enclosure_name, enclosure_name_th, zone_name, zone_name_th")
      .order("name")
      .returns<
        {
          resident_id: string;
          name: string;
          thai_name: string | null;
          resident_code: string | null;
          enclosure_name: string | null;
          enclosure_name_th: string | null;
          zone_name: string | null;
          zone_name_th: string | null;
        }[]
      >(),
    supabase
      .from("residents")
      .select("id, profile_photo_drive_file_id")
      .not("profile_photo_drive_file_id", "is", null)
      .returns<{ id: string; profile_photo_drive_file_id: string }[]>(),
    supabase
      .from("attachments")
      .select("owner_id")
      .eq("owner_type", "resident")
      .not("approved_at", "is", null)
      .order("uploaded_at", { ascending: false })
      .limit(400)
      .returns<{ owner_id: string }[]>(),
  ]);
  const photoOf = new Map((profiles ?? []).map((p) => [p.id, p.profile_photo_drive_file_id]));
  const rank = new Map<string, number>();
  for (const a of recent ?? []) if (!rank.has(a.owner_id)) rank.set(a.owner_id, rank.size);
  const th = locale === "th";
  const list = (residents ?? [])
    .map((r) => {
      const zone = th ? (r.zone_name_th ?? r.zone_name) : r.zone_name;
      const enc = th ? (r.enclosure_name_th ?? r.enclosure_name) : r.enclosure_name;
      const photo = photoOf.get(r.resident_id);
      return {
        id: r.resident_id,
        name: r.name,
        thai_name: r.thai_name,
        code: r.resident_code,
        where: [zone, enc].filter(Boolean).join(" · ") || null,
        photo: photo ? driveImageUrl(photo, 160) : null,
      };
    })
    .sort((a, b) => (rank.get(a.id) ?? 1e9) - (rank.get(b.id) ?? 1e9) || a.name.localeCompare(b.name));
  return shell(
    <>
      <p className="text-base text-muted">{m.pickResidentHint}</p>
      <ResidentSearch residents={list} placeholder={m.searchResident} recentLabel={m.recentResidents} noMatch={m.noResidentMatch} />
    </>,
  );
}

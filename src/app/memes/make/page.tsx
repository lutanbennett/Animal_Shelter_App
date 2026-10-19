import Link from "next/link";
import { BackLink } from "@/components/BackLink";
import { getT } from "@/lib/i18n/get-t";
import { requirePermission } from "@/lib/permissions/require";
import { driveImageUrl, isMedicalFolder } from "@/lib/google/drive-client";
import { checkMakerSource, type MakerSourceRow } from "@/lib/memes/maker-source";
import { MemeMaker } from "./MemeMaker";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FILE_ID = /^[A-Za-z0-9_-]{10,100}$/;

/**
 * The meme maker (stage 2 of the library). `?photo=<drive file id>` opens it on that photo; `?resident=<id>` lists that
 * resident's photos to choose from; with neither, the residents. Only non-Medical, approved photos are offered here,
 * and the save (createMeme with sourceFileId) refuses a Medical one again on the server, so this page is a convenience
 * and not the rule. docs/decisions/2026-10-19-meme-maker.md.
 */
export default async function MakeMemePage(props: PageProps<"/memes/make">) {
  const { photo, resident } = await props.searchParams;
  const photoId = typeof photo === "string" ? photo : "";
  const residentId = typeof resident === "string" ? resident : "";
  const { supabase } = await requirePermission("social.library");
  const { t } = await getT();
  const m = t.memes.maker;

  const shell = (body: React.ReactNode) => (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <BackLink href="/memes">{m.back}</BackLink>
      <h1 className="text-2xl font-semibold text-foreground">{m.title}</h1>
      {body}
    </main>
  );

  if (photoId) {
    const { data: rows } = FILE_ID.test(photoId)
      ? await supabase
          .from("attachments")
          .select("owner_id, sub_folder, approved_at")
          .eq("owner_type", "resident")
          .eq("drive_file_id", photoId)
          .returns<MakerSourceRow[]>()
      : { data: null };
    const source = checkMakerSource(rows);
    if (!source.ok) return shell(<p role="alert" className="text-base text-danger">{m.refused}</p>);
    const { data: names } = await supabase
      .from("resident_list_view")
      .select("name")
      .in("resident_id", source.residentIds)
      .returns<{ name: string }[]>();
    const label = (names ?? []).map((n) => n.name).join(", ");
    return shell(<MemeMaker photoId={photoId} residentLabel={label} />);
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
    const usable = (photos ?? []).filter(
      (p) => !isMedicalFolder(p.sub_folder) && /\.(jpe?g|png|webp)$/i.test(p.file_name ?? ""),
    );
    return shell(
      <>
        <h2 className="text-lg font-semibold text-foreground">{m.pickPhoto(who?.[0]?.name ?? "")}</h2>
        {usable.length === 0 ? (
          <p className="text-base text-muted">{m.noPhotos}</p>
        ) : (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {usable.map((p) => (
              <li key={p.drive_file_id}>
                <Link href={`/memes/make?photo=${p.drive_file_id}`} className="block overflow-hidden rounded border border-border">
                  <img src={driveImageUrl(p.drive_file_id, 400)} alt={p.file_name ?? ""} className="aspect-square w-full object-cover" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </>,
    );
  }

  const { data: residents } = await supabase
    .from("resident_list_view")
    .select("resident_id, name, thai_name")
    .order("name")
    .returns<{ resident_id: string; name: string; thai_name: string | null }[]>();
  return shell(
    <>
      <p className="text-base text-muted">{m.pickResidentHint}</p>
      <ul className="flex flex-col gap-1">
        {(residents ?? []).map((r) => (
          <li key={r.resident_id}>
            <Link
              href={`/memes/make?resident=${r.resident_id}`}
              className="flex min-h-11 items-center rounded border border-border px-3 py-2 text-base text-foreground hover:bg-surface-hover"
            >
              {r.name}
              {r.thai_name ? <span className="ml-2 text-muted">{r.thai_name}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </>,
  );
}

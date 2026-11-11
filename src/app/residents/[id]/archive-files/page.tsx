import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { getDriveClient } from "@/lib/google/drive";
import { driveDocumentUrl } from "@/lib/google/drive-client";

/**
 * A closed resident's archive folder, served by the app instead of drive.google.com
 * (docs/decisions/2026-11-11-drive-links-app-served.md). The resident row is read as the caller, so RLS is the
 * check (the same one /api/documents/<id> reaches through can_see_drive_file for the summary and index). The
 * folder is listed as the app owner, then each file is kept only if can_see_drive_file() says this caller may
 * open it, so the list can never show a file its own link would refuse. Every file opens at /api/documents/<id>.
 */
const FOLDER_MIME = "application/vnd.google-apps.folder";
const MAX_FILES = 200;

type Entry = { id: string; name: string; path: string };

async function listTree(folderId: string): Promise<Entry[]> {
  const drive = getDriveClient();
  const out: Entry[] = [];
  const queue: { id: string; path: string; depth: number }[] = [{ id: folderId, path: "", depth: 0 }];
  while (queue.length && out.length < MAX_FILES) {
    const next = queue.shift()!;
    const files = await drive.listFiles({
      q: `'${next.id}' in parents and trashed = false`,
      fields: "files(id,name,mimeType)",
      orderBy: "name",
      pageSize: 200,
    });
    for (const f of files) {
      if (!f.name) continue;
      if (f.mimeType === FOLDER_MIME) {
        if (next.depth < 3) queue.push({ id: f.id, path: `${next.path}${f.name}/`, depth: next.depth + 1 });
      } else {
        out.push({ id: f.id, name: f.name, path: next.path });
      }
    }
  }
  return out;
}

export default async function ArchiveFilesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { t } = await getT();
  const b = t.residents.deceased.banner;

  const { data: resident } = await supabase
    .from("residents")
    .select("id, name, resident_code, drive_folder_id, deceased_archived_at")
    .eq("id", id)
    .maybeSingle();
  if (!resident || !resident.drive_folder_id || !resident.deceased_archived_at) notFound();

  let entries: Entry[] = [];
  let failed = false;
  try {
    entries = await listTree(resident.drive_folder_id);
  } catch {
    failed = true;
  }
  const visible: Entry[] = [];
  for (const entry of entries) {
    const { data } = await supabase.rpc("can_see_drive_file", { p_drive_file_id: entry.id });
    if (data === true) visible.push(entry);
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-6">
      <div>
        <Link href={`/residents/${resident.id}`} className="text-sm text-muted underline hover:text-primary">
          {b.folderBack}
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">{b.folderTitle(`${resident.name} (${resident.resident_code})`)}</h1>
      </div>
      {failed ? (
        <p role="alert" className="text-sm text-danger">{b.folderFailed}</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted">{b.folderEmpty}</p>
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {visible.map((f) => (
            <li key={f.id}>
              <a href={driveDocumentUrl(f.id)} target="_blank" rel="noopener" className="text-primary underline">
                {f.path}
                {f.name}
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

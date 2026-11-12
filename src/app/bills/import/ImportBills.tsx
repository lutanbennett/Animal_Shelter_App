"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ActionButton } from "@/components/ActionButton";
import { ACTION_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useWriteCall } from "@/lib/use-write-form";
import { downloadCsv, toCsv } from "@/lib/csv";
import { formatBahtExact } from "@/lib/format";
import { importBills, previewBillImport, type ImportDone, type ImportPreview, type RejectView } from "./actions";

const cell = "border-b border-border px-2 py-1 text-left align-top";

/** The rejected rows as a file: the line they were on, their own columns, then why. */
function downloadRejects(header: string[], rejects: RejectView[], heading: { line: string; reason: string; file: string }) {
  const rows = [[heading.line, ...header, heading.reason], ...rejects.map((r) => [String(r.line), ...header.map((_, i) => r.cells[i] ?? ""), r.reason])];
  downloadCsv(heading.file, toCsv(rows));
}

/**
 * Choose a file, read what would happen, then press the import. Drawn only on a page that already asked canImportBills; both
 * actions ask it again, and each row is checked for its own destination's card. The file is read again by the import press,
 * so nothing is stored between the two.
 */
export function ImportBills() {
  const { t, locale } = useI18n();
  const m = t.bills.import;
  const write = useWriteCall();
  const [pending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [done, setDone] = useState<ImportDone | null>(null);
  const [inputKey, setInputKey] = useState(0);

  const body = () => {
    const f = new FormData();
    if (file) f.set("file", file);
    return f;
  };
  const reset = () => {
    setFile(null);
    setPreview(null);
    setDone(null);
    setError(null);
    setInputKey((k) => k + 1);
  };
  const heading = { line: m.rejectsLineHeading, reason: m.rejectsReasonHeading, file: m.rejectsFile };

  const check = () =>
    startTransition(async () => {
      setError(null);
      setPreview(null);
      const result = await previewBillImport(body());
      if (!result.ok) return setError(result.error);
      setPreview(result.preview);
    });

  const run = () =>
    startTransition(async () => {
      setError(null);
      const data = body();
      const result = await write((id) => importBills(data, id));
      if (!result.ok) return setError(result.error);
      setDone(result.done);
      setPreview(null);
    });

  if (done) {
    return (
      <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
        <p className="text-sm font-medium text-foreground" role="status">
          {m.done(done.added)}
        </p>
        {done.rejects.length > 0 && (
          <>
            <p className="text-sm text-danger">{m.doneRejects(done.rejects.length)}</p>
            <div>
              <ActionButton icon={ACTION_ICONS.save} onClick={() => downloadRejects(done.header, done.rejects, heading)}>
                {m.downloadRejects}
              </ActionButton>
            </div>
          </>
        )}
        <div className="flex flex-wrap gap-3">
          <Link href="/bills" className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline">
            {m.seeBills}
          </Link>
          <button type="button" onClick={reset} className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline">
            {m.again}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <label className="flex flex-col gap-1 text-sm font-medium text-muted">
        {m.chooseFile}
        <input
          key={inputKey}
          type="file"
          accept=".csv,text/csv"
          className="text-sm text-foreground"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setPreview(null);
            setError(null);
          }}
        />
      </label>
      <div>
        <ActionButton icon={ACTION_ICONS.save} variant="primary" disabled={pending || !file} onClick={check}>
          {pending && !preview ? m.checking : m.check}
        </ActionButton>
      </div>
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      {preview && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-foreground">{m.previewHeading}</h2>
          <p className="text-sm text-foreground">{m.goodCount(preview.good.length)}</p>
          {preview.good.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] border-collapse text-xs">
                <thead>
                  <tr className="text-muted">
                    {[m.colLine, m.colDestination, m.colKind, m.colPlace, m.colAccount, m.colAmount, m.colDate, m.colMonth, m.colPhoto].map((h) => (
                      <th key={h} className={cell + " font-medium"}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.good.map((g) => (
                    <tr key={g.line}>
                      <td className={cell}>{g.line}</td>
                      <td className={cell}>{g.route}</td>
                      <td className={cell}>{g.kind}</td>
                      <td className={cell}>{g.place}</td>
                      <td className={cell}>{g.account}</td>
                      <td className={cell}>{formatBahtExact(g.amount, locale)}</td>
                      <td className={cell}>{g.date}</td>
                      <td className={cell}>{g.month}</td>
                      <td className={cell}>{g.photo || m.noPhoto}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {preview.rejects.length > 0 && (
            <>
              <p className="text-sm font-medium text-danger">{m.rejectCount(preview.rejects.length)}</p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[30rem] border-collapse text-xs">
                  <thead>
                    <tr className="text-muted">
                      <th className={cell + " font-medium"}>{m.colLine}</th>
                      <th className={cell + " font-medium"}>{m.colReason}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rejects.map((r) => (
                      <tr key={r.line}>
                        <td className={cell}>{r.line}</td>
                        <td className={cell}>{r.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <ActionButton icon={ACTION_ICONS.save} onClick={() => downloadRejects(preview.header, preview.rejects, heading)}>
                  {m.downloadRejects}
                </ActionButton>
              </div>
            </>
          )}
          {preview.good.length === 0 ? (
            <p className="text-sm text-muted">{m.nothingToAdd}</p>
          ) : (
            <div>
              <ActionButton icon={ACTION_ICONS.add} variant="primary" disabled={pending} onClick={run}>
                {pending ? m.importing : m.importN(preview.good.length)}
              </ActionButton>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

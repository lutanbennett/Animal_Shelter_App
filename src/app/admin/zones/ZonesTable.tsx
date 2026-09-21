"use client";

import { Fragment, useState, useTransition } from "react";
import { deleteZone, updateZone } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";

export type ZoneRow = { id: string; name: string; name_th: string | null; internal: boolean };

function ZoneRowItem({ zone }: { zone: ZoneRow }) {
  const { t } = useI18n();
  const isSystem = zone.name === "Lifecycle";

  const [name, setName] = useState(zone.name);
  const [nameTh, setNameTh] = useState(zone.name_th ?? "");
  const [internal, setInternal] = useState(zone.internal);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<
    { type: "error" | "success"; text: string } | null
  >(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      try {
        await updateZone(zone.id, name, nameTh || null, internal);
        setEditing(false);
        setMessage({ type: "success", text: t.common.saved });
      } catch (err) {
        setMessage({
          type: "error",
          text: err instanceof Error ? err.message : t.common.failedToSave,
        });
      }
    });
  }

  function handleDelete() {
    if (!window.confirm(t.admin.zones.deleteConfirm(zone.name))) return;
    setMessage(null);
    startTransition(async () => {
      try {
        await deleteZone(zone.id);
      } catch (err) {
        setMessage({
          type: "error",
          text: err instanceof Error ? err.message : t.common.failedToDelete,
        });
      }
    });
  }

  return (
    <Fragment>
      <tr className="align-top hover:bg-surface-hover">
        <td className="px-4 py-2">
          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-48 rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
            />
          ) : (
            <span className="text-foreground">
              {zone.name}
              {isSystem && (
                <span className="ml-2 text-xs text-muted">{t.common.system}</span>
              )}
            </span>
          )}
        </td>
        <td className="px-4 py-2">
          {editing ? (
            <input
              value={nameTh}
              lang="th"
              onChange={(e) => setNameTh(e.target.value)}
              className="w-48 rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
            />
          ) : (
            <span className="text-foreground">{zone.name_th ?? t.common.dash}</span>
          )}
        </td>
        <td className="px-4 py-2">
          {editing ? (
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={internal}
                onChange={(e) => setInternal(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              {t.admin.zones.createForm.internal}
            </label>
          ) : (
            <span className="text-muted">
              {zone.internal
                ? t.admin.zones.table.internal
                : t.admin.zones.table.external}
            </span>
          )}
        </td>
        <td className="px-4 py-2">
          {isSystem ? (
            <span className="text-xs text-muted">
              {t.admin.zones.table.systemNote}
            </span>
          ) : (
            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleSave}
                    className="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
                  >
                    {t.common.save}
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      setEditing(false);
                      setName(zone.name);
                      setNameTh(zone.name_th ?? "");
                      setInternal(zone.internal);
                    }}
                    className="rounded border border-border px-2 py-1 text-xs font-medium text-muted hover:bg-surface-hover"
                  >
                    {t.common.cancel}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded border border-border px-2 py-1 text-xs font-medium text-muted hover:bg-surface-hover hover:text-foreground"
                >
                  {t.common.edit}
                </button>
              )}
              <button
                type="button"
                disabled={isPending}
                onClick={handleDelete}
                className="rounded border border-danger/40 px-2 py-1 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
              >
                {t.common.delete}
              </button>
            </div>
          )}
        </td>
      </tr>
      {message && (
        <tr>
          <td
            colSpan={4}
            className={`px-4 pb-2 text-xs ${
              message.type === "error" ? "text-danger" : "text-success"
            }`}
          >
            {message.text}
          </td>
        </tr>
      )}
    </Fragment>
  );
}

export function ZonesTable({ zones }: { zones: ZoneRow[] }) {
  const { t } = useI18n();

  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-2 font-medium">{t.admin.zones.table.name}</th>
            <th className="px-4 py-2 font-medium">{t.admin.zones.table.nameTh}</th>
            <th className="px-4 py-2 font-medium">
              {t.admin.zones.table.location}
            </th>
            <th className="px-4 py-2 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {zones.map((zone) => (
            <ZoneRowItem key={zone.id} zone={zone} />
          ))}
          {zones.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-muted">
                {t.admin.zones.table.noZones}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

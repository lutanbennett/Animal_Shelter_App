"use client";

import { Fragment, useState, useTransition } from "react";
import { deleteEnclosure, updateEnclosure } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";

type ZoneOption = { id: string; name: string };

export type EnclosureRow = {
  id: string;
  name: string;
  name_th: string | null;
  capacity: number | null;
  notes: string | null;
  zone_id: string;
  zones: { name: string } | null;
};

function EnclosureRowItem({
  enclosure,
  zones,
}: {
  enclosure: EnclosureRow;
  zones: ZoneOption[];
}) {
  const { t } = useI18n();
  const isSystem = enclosure.zones?.name === "Lifecycle";

  const [name, setName] = useState(enclosure.name);
  const [nameTh, setNameTh] = useState(enclosure.name_th ?? "");
  const [zoneId, setZoneId] = useState(enclosure.zone_id);
  const [capacity, setCapacity] = useState(
    enclosure.capacity?.toString() ?? "",
  );
  const [notes, setNotes] = useState(enclosure.notes ?? "");
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<
    { type: "error" | "success"; text: string } | null
  >(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setMessage(null);
    const parsedCapacity = capacity ? Number(capacity) : null;
    if (
      capacity &&
      (!Number.isFinite(parsedCapacity) || (parsedCapacity ?? -1) < 0)
    ) {
      setMessage({
        type: "error",
        text: t.admin.enclosures.errors.capacityNonNegative,
      });
      return;
    }
    startTransition(async () => {
      try {
        await updateEnclosure(enclosure.id, {
          name,
          nameTh: nameTh || null,
          zoneId,
          capacity: parsedCapacity,
          notes: notes || null,
        });
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
    if (!window.confirm(t.admin.enclosures.deleteConfirm(enclosure.name))) return;
    setMessage(null);
    startTransition(async () => {
      try {
        await deleteEnclosure(enclosure.id);
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
              className="w-40 rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
            />
          ) : (
            <span className="text-foreground">
              {enclosure.name}
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
              className="w-40 rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
            />
          ) : (
            <span className="text-foreground">{enclosure.name_th ?? t.common.dash}</span>
          )}
        </td>
        <td className="px-4 py-2">
          {editing ? (
            <select
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className="w-40 rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
            >
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-muted">
              {enclosure.zones?.name ?? t.common.dash}
            </span>
          )}
        </td>
        <td className="px-4 py-2">
          {editing ? (
            <input
              type="number"
              min={0}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-20 rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
            />
          ) : (
            <span className="text-muted">
              {enclosure.capacity ?? t.common.dash}
            </span>
          )}
        </td>
        <td className="px-4 py-2">
          {editing ? (
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-48 rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
            />
          ) : (
            <span className="text-muted">{enclosure.notes ?? t.common.dash}</span>
          )}
        </td>
        <td className="px-4 py-2">
          {isSystem ? (
            <span className="text-xs text-muted">
              {t.admin.enclosures.table.systemNote}
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
                      setName(enclosure.name);
                      setNameTh(enclosure.name_th ?? "");
                      setZoneId(enclosure.zone_id);
                      setCapacity(enclosure.capacity?.toString() ?? "");
                      setNotes(enclosure.notes ?? "");
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
            colSpan={6}
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

export function EnclosuresTable({
  enclosures,
  zones,
}: {
  enclosures: EnclosureRow[];
  zones: ZoneOption[];
}) {
  const { t } = useI18n();

  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-2 font-medium">
              {t.admin.enclosures.table.name}
            </th>
            <th className="px-4 py-2 font-medium">
              {t.admin.enclosures.table.nameTh}
            </th>
            <th className="px-4 py-2 font-medium">
              {t.admin.enclosures.table.zone}
            </th>
            <th className="px-4 py-2 font-medium">
              {t.admin.enclosures.table.capacity}
            </th>
            <th className="px-4 py-2 font-medium">
              {t.admin.enclosures.table.notes}
            </th>
            <th className="px-4 py-2 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {enclosures.map((enclosure) => (
            <EnclosureRowItem
              key={enclosure.id}
              enclosure={enclosure}
              zones={zones}
            />
          ))}
          {enclosures.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-muted">
                {t.admin.enclosures.table.noEnclosures}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

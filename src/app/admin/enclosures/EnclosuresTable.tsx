"use client";

import { ActionButton } from "@/components/ActionButton";
import { useConfirm } from "@/components/ConfirmProvider";
import { Fragment, useState, useTransition } from "react";
import { deleteEnclosure, moveEnclosure, sortEnclosuresByName, updateEnclosure } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ACTION_ICONS } from "@/components/hub-icons";
import { RowActionButton } from "@/components/RowAction";
import { inShelterOrder } from "@/lib/enclosures/order";

/** In the shelter's order (the page sorts them), Lifecycle last. */
type ZoneOption = { id: string; name: string; sort_order: number | null };

export type EnclosureRow = {
  id: string;
  name: string;
  name_th: string | null;
  capacity: number | null;
  notes: string | null;
  zone_id: string;
  sort_order: number | null;
  zones: { name: string } | null;
};

const COLUMNS = 7;

/** A zone's heading row: its name, and Sort A-Z for the enclosures under it. */
function ZoneHeading({ zone, count }: { zone: ZoneOption; count: number }) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isSystem = zone.name === "Lifecycle";

  async function handleSortByName() {
    if (!await confirm({ body: t.admin.placeOrder.sortEnclosuresConfirm(zone.name), confirmLabel: t.admin.placeOrder.sortByName })) return;
    setError(null);
    startTransition(async () => {
      const result = await sortEnclosuresByName(zone.id);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <tr className="bg-surface">
      <th colSpan={COLUMNS} scope="rowgroup" className="px-4 py-2 text-left font-semibold text-foreground">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>{zone.name}</span>
          {!isSystem && (
            <ActionButton
              icon={ACTION_ICONS.sortByName}
              compact
              disabled={isPending || count < 2}
              onClick={handleSortByName}
            >
              {t.admin.placeOrder.sortByName}
            </ActionButton>
          )}
        </div>
        {error && <p className="mt-1 text-xs font-normal text-danger">{error}</p>}
      </th>
    </tr>
  );
}

function EnclosureRowItem({
  enclosure,
  zones,
  position,
  count,
}: {
  enclosure: EnclosureRow;
  zones: ZoneOption[];
  /** 0-based place within its zone. */
  position: number;
  /** How many enclosures its zone holds. */
  count: number;
}) {
  const { t } = useI18n();
  const confirm = useConfirm();
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
      const result = await updateEnclosure(enclosure.id, {
        name,
        nameTh: nameTh || null,
        zoneId,
        capacity: parsedCapacity,
        notes: notes || null,
      });
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setEditing(false);
      setMessage({ type: "success", text: t.common.saved });
    });
  }

  async function handleDelete() {
    if (!await confirm({ body: t.admin.enclosures.deleteConfirm(enclosure.name), confirmLabel: t.common.delete })) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteEnclosure(enclosure.id);
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
      }
    });
  }

  function handleMove(direction: "up" | "down") {
    setMessage(null);
    startTransition(async () => {
      const result = await moveEnclosure(enclosure.id, direction);
      if (!result.ok) setMessage({ type: "error", text: result.error });
    });
  }

  return (
    <Fragment>
      <tr className="align-top hover:bg-surface-hover">
        <td className="px-4 py-2 text-right tabular-nums text-muted">
          {isSystem ? t.common.dash : position + 1}
        </td>
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
              {t.admin.enclosures.table.systemNote} {t.admin.placeOrder.lifecycleFixed}
            </span>
          ) : (
            <div className="grid w-max grid-cols-2 gap-2 md:flex md:items-center">
              <RowActionButton
                disabled={isPending || position === 0}
                onClick={() => handleMove("up")}
                label={t.admin.placeOrder.moveUp(enclosure.name)}
                icon={ACTION_ICONS.moveUp}
              />
              <RowActionButton
                disabled={isPending || position === count - 1}
                onClick={() => handleMove("down")}
                label={t.admin.placeOrder.moveDown(enclosure.name)}
                icon={ACTION_ICONS.moveDown}
              />
              {editing ? (
                <>
                  <ActionButton icon={ACTION_ICONS.save} variant="primary" compact disabled={isPending} onClick={handleSave}>
                    {t.common.save}
                  </ActionButton>
                  <ActionButton
                    icon={ACTION_ICONS.clear}
                    compact
                    disabled={isPending}
                    onClick={() => {
                      setEditing(false);
                      setName(enclosure.name);
                      setNameTh(enclosure.name_th ?? "");
                      setZoneId(enclosure.zone_id);
                      setCapacity(enclosure.capacity?.toString() ?? "");
                      setNotes(enclosure.notes ?? "");
                    }}
                  >
                    {t.common.cancel}
                  </ActionButton>
                </>
              ) : (
                <RowActionButton
                  onClick={() => setEditing(true)}
                  label={t.common.edit}
                  subject={enclosure.name}
                  icon={ACTION_ICONS.edit}
                />
              )}
              <RowActionButton
                disabled={isPending}
                onClick={handleDelete}
                label={t.common.delete}
                subject={enclosure.name}
                icon={ACTION_ICONS.delete}
                tone="danger"
              />
            </div>
          )}
        </td>
      </tr>
      {message && (
        <tr>
          <td
            colSpan={COLUMNS}
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

  // One group per zone, in the shelter's order; enclosures in their order within it.
  // Lifecycle has no order (0161), so its zone and its pseudo-enclosures come last.
  const groups = inShelterOrder(zones)
    .map((zone) => ({
      zone,
      enclosures: inShelterOrder(enclosures.filter((e) => e.zone_id === zone.id)),
    }))
    .filter((group) => group.enclosures.length > 0);

  return (
    <div className="flex flex-col gap-3">
      <p className="max-w-prose text-sm text-muted">{t.admin.placeOrder.enclosuresNote}</p>
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-muted">
            <tr>
              <th className="px-4 py-2 text-right font-medium">
                {t.admin.placeOrder.orderColumn}
              </th>
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
          {groups.map(({ zone, enclosures: inZone }) => (
            <tbody key={zone.id} className="divide-y divide-border border-t border-border">
              <ZoneHeading zone={zone} count={inZone.length} />
              {inZone.map((enclosure, index) => (
                <EnclosureRowItem
                  key={enclosure.id}
                  enclosure={enclosure}
                  zones={zones}
                  position={index}
                  count={inZone.length}
                />
              ))}
            </tbody>
          ))}
          {groups.length === 0 && (
            <tbody>
              <tr>
                <td colSpan={COLUMNS} className="px-4 py-6 text-center text-muted">
                  {t.admin.enclosures.table.noEnclosures}
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
}

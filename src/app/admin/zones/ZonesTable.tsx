"use client";

import { ActionButton } from "@/components/ActionButton";
import { useConfirm } from "@/components/ConfirmProvider";
import { Fragment, useState, useTransition } from "react";
import { deleteZone, moveZone, sortZonesByName, updateZone } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ACTION_ICONS } from "@/components/hub-icons";
import { RowActionButton } from "@/components/RowAction";
import { inShelterOrder } from "@/lib/enclosures/order";

export type ZoneRow = {
  id: string;
  name: string;
  name_th: string | null;
  internal: boolean;
  sort_order: number | null;
};

function ZoneRowItem({
  zone,
  position,
  count,
}: {
  zone: ZoneRow;
  /** 0-based place among the physical zones; null for Lifecycle, which takes no order. */
  position: number | null;
  count: number;
}) {
  const { t } = useI18n();
  const confirm = useConfirm();
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
      const result = await updateZone(zone.id, name, nameTh || null, internal);
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setEditing(false);
      setMessage({ type: "success", text: t.common.saved });
    });
  }

  function handleMove(direction: "up" | "down") {
    setMessage(null);
    startTransition(async () => {
      const result = await moveZone(zone.id, direction);
      if (!result.ok) setMessage({ type: "error", text: result.error });
    });
  }

  async function handleDelete() {
    if (!await confirm({ body: t.admin.zones.deleteConfirm(zone.name), confirmLabel: t.common.delete })) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteZone(zone.id);
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
      }
    });
  }

  return (
    <Fragment>
      <tr className="align-top hover:bg-surface-hover">
        <td className="px-4 py-2 text-right tabular-nums text-muted">
          {position === null ? t.common.dash : position + 1}
        </td>
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
              {t.admin.zones.table.systemNote} {t.admin.placeOrder.lifecycleFixed}
            </span>
          ) : (
            <div className="grid w-max grid-cols-2 gap-2 md:flex md:items-center">
              <RowActionButton
                disabled={isPending || position === 0}
                onClick={() => handleMove("up")}
                label={t.admin.placeOrder.moveUp(zone.name)}
                icon={ACTION_ICONS.moveUp}
              />
              <RowActionButton
                disabled={isPending || position === null || position === count - 1}
                onClick={() => handleMove("down")}
                label={t.admin.placeOrder.moveDown(zone.name)}
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
                      setName(zone.name);
                      setNameTh(zone.name_th ?? "");
                      setInternal(zone.internal);
                    }}
                  >
                    {t.common.cancel}
                  </ActionButton>
                </>
              ) : (
                <RowActionButton
                  onClick={() => setEditing(true)}
                  label={t.common.edit}
                  subject={zone.name}
                  icon={ACTION_ICONS.edit}
                />
              )}
              <RowActionButton
                disabled={isPending}
                onClick={handleDelete}
                label={t.common.delete}
                subject={zone.name}
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
            colSpan={5}
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
  const confirm = useConfirm();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // The shelter's order; Lifecycle has none (0161), so it sorts last and is not counted.
  const ordered = inShelterOrder(zones);
  const physical = ordered.filter((zone) => zone.name !== "Lifecycle");

  async function handleSortByName() {
    if (!await confirm({ body: t.admin.placeOrder.sortZonesConfirm, confirmLabel: t.admin.placeOrder.sortByName })) return;
    setError(null);
    startTransition(async () => {
      const result = await sortZonesByName();
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-prose text-sm text-muted">{t.admin.placeOrder.zonesNote}</p>
        <ActionButton
          icon={ACTION_ICONS.sortByName}
          disabled={isPending || physical.length < 2}
          onClick={handleSortByName}
        >
          {t.admin.placeOrder.sortByName}
        </ActionButton>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-muted">
            <tr>
              <th className="px-4 py-2 text-right font-medium">{t.admin.placeOrder.orderColumn}</th>
              <th className="px-4 py-2 font-medium">{t.admin.zones.table.name}</th>
              <th className="px-4 py-2 font-medium">{t.admin.zones.table.nameTh}</th>
              <th className="px-4 py-2 font-medium">
                {t.admin.zones.table.location}
              </th>
              <th className="px-4 py-2 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ordered.map((zone) => {
              const index = physical.indexOf(zone);
              return (
                <ZoneRowItem
                  key={zone.id}
                  zone={zone}
                  position={index === -1 ? null : index}
                  count={physical.length}
                />
              );
            })}
            {zones.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  {t.admin.zones.table.noZones}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

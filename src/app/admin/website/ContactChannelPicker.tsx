"use client";

import { ACTION_ICONS } from "@/components/hub-icons";
import { RowActionButton } from "@/components/RowAction";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { CONTACT_CHANNELS, isContactChannel, type ContactChannel } from "@/lib/site/channels";

/** The stored list, then every channel it leaves out in the built-in order. */
function fullOrder(stored: string[]): ContactChannel[] {
  return [...new Set([...stored.filter(isContactChannel), ...CONTACT_CHANNELS])];
}

/**
 * "Preferred way to contact us": the channels that have a value, in the
 * order the public site offers them, first = preferred. The whole order is
 * kept and submitted (as `preferred_channels`, comma-separated), not just
 * the visible rows, so a channel cleared today keeps its place if its
 * link is typed back in later. Which channels have a value is the form's
 * business, passed in as `available`; the public site checks it again
 * when it reads (src/lib/site/channels.ts).
 */
export function ContactChannelPicker({
  stored,
  available,
}: {
  stored: string[];
  available: Record<ContactChannel, boolean>;
}) {
  const { t } = useI18n();
  const s = t.admin.website.settings;
  const [order, setOrder] = useState(() => fullOrder(stored));
  const visible = order.filter((c) => available[c]);

  function move(channel: ContactChannel, by: -1 | 1) {
    const neighbour = visible[visible.indexOf(channel) + by];
    if (!neighbour) return;
    const next = [...order];
    const a = next.indexOf(channel);
    const b = next.indexOf(neighbour);
    [next[a], next[b]] = [next[b], next[a]];
    setOrder(next);
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-muted">{s.preferredHeading}</legend>
      <p className="text-xs text-muted">{s.preferredHint}</p>
      <input type="hidden" name="preferred_channels" value={order.join(",")} />
      {visible.length === 0 ? (
        <p className="text-sm text-muted">{s.preferredNone}</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {visible.map((channel, i) => {
            const name = t.contactChannels.name[channel];
            return (
              <li
                key={channel}
                className="flex items-center gap-2 rounded border border-border bg-background px-3 py-2"
              >
                <span className="w-5 text-sm text-muted">{i + 1}</span>
                <span className="flex-1 text-sm font-medium text-foreground">{name}</span>
                {i === 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {s.preferredFirst}
                  </span>
                )}
                <RowActionButton
                  disabled={i === 0}
                  label={s.moveUp(name)}
                  icon={ACTION_ICONS.moveUp}
                  onClick={() => move(channel, -1)}
                />
                <RowActionButton
                  disabled={i === visible.length - 1}
                  label={s.moveDown(name)}
                  icon={ACTION_ICONS.moveDown}
                  onClick={() => move(channel, 1)}
                />
              </li>
            );
          })}
        </ol>
      )}
    </fieldset>
  );
}

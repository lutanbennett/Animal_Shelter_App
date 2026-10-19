"use client";

import { Laugh } from "lucide-react";
import { ActionLink } from "@/components/ActionLink";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { SourceKind } from "@/lib/memes/sources";

/**
 * "Make a meme" under a photo, opening the maker on it. Shown only to a login holding the library at Edit (the caller
 * decides); the maker and the save check the photo again, so this is a convenience and not the rule.
 */
export function MakeMemeLink({ source, fileId }: { source: SourceKind; fileId: string }) {
  const { t } = useI18n();
  return (
    <ActionLink
      href={`/memes/make?source=${source}&photo=${fileId}`}
      label={t.memes.maker.button}
      icon={Laugh}
      iconOnlyOnMobile={false}
    />
  );
}

"use client";

import { File, FileImage, FileText } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { FileKind } from "@/lib/uploads/file-kind";

/**
 * The picture that stands in for a thumbnail when there is none to show —
 * a PDF or other non-image, or an image the browser cannot preview (a HEIC
 * picked on a form, DeferredUploads.tsx). It carries its own accessible
 * name ("PDF document"), not aria-hidden, so a screen reader walking a list
 * of mixed attachments still hears which one is the PDF — the file name
 * beside it may not say.
 */
export function FileTypeIcon({
  kind,
  className = "h-8 w-8",
}: {
  kind: FileKind;
  className?: string;
}) {
  const { t } = useI18n();
  const Icon = kind === "image" ? FileImage : kind === "other" ? File : FileText;
  return (
    <Icon
      role="img"
      aria-label={t.uploads.fileKind[kind]}
      aria-hidden={false}
      className={`${className} shrink-0 ${kind === "pdf" ? "text-danger" : "text-muted"}`}
    />
  );
}

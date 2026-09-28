/**
 * What kind of file an attachment is, for choosing between a thumbnail and
 * a type icon. Read from the file name because that is all `attachments`
 * stores (0001 has no MIME column). The name is not a blind guess: every
 * upload route has already sniffed the bytes (file-signature.ts) against a
 * list of images plus PDF, so a stored `.pdf` really was one.
 *
 * Plain function, no imports, so server and client code can both call it.
 */
export type FileKind = "image" | "pdf" | "document" | "other";

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|heic|heif|gif)$/i;
const DOCUMENT_EXTENSIONS = /\.(docx?|odt|rtf|txt)$/i;

export function fileKind(fileName: string | null): FileKind {
  if (!fileName) return "other";
  if (IMAGE_EXTENSIONS.test(fileName)) return "image";
  if (/\.pdf$/i.test(fileName)) return "pdf";
  if (DOCUMENT_EXTENSIONS.test(fileName)) return "document";
  return "other";
}

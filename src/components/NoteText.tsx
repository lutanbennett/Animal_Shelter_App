import Link from "next/link";
import { segmentNote, type NoteTag } from "@/lib/note-tags/text";

/**
 * A note as written, with each tagged resident's "#name" as a link to that resident. The link follows the stored id,
 * so a later rename does not break it; a tag whose words were edited out is simply not a link. Pass no tags and it is
 * the plain text. The caller decides whether the login may see the note at all.
 */
export function NoteText({ text, tags = [] }: { text: string; tags?: readonly NoteTag[] }) {
  if (tags.length === 0) return <>{text}</>;
  return (
    <>
      {segmentNote(text, tags).map((part, index) =>
        part.tag ? (
          <Link
            key={index}
            href={`/residents/${part.tag.id}`}
            className="font-medium text-primary underline underline-offset-4"
          >
            {part.text}
          </Link>
        ) : (
          part.text
        ),
      )}
    </>
  );
}

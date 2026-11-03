import { driveImageUrl, videoUrl } from "@/lib/google/drive-client";

/**
 * A video on a public page (success stories, a journey). It never plays by itself: no autoplay, so no sound
 * starts on its own; the visitor presses play. The poster is the same Drive thumbnail the photo proxy serves
 * for a public file, and preload="none" keeps a page of videos from downloading any until one is played.
 * The stream is /api/videos/<id>, which answers a signed-out visitor only for a file is_public_drive_file lists.
 */
export function PublicVideo({ fileId, label, className = "" }: { fileId: string; label: string; className?: string }) {
  return (
    <video
      src={videoUrl(fileId)}
      poster={driveImageUrl(fileId, 800)}
      controls
      playsInline
      preload="none"
      aria-label={label}
      className={`bg-black object-contain ${className}`}
    />
  );
}

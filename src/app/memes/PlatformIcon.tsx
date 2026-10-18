import { MessageCircle, Music2, Share2 } from "lucide-react";
import { FacebookIcon } from "@/components/FacebookIcon";
import { InstagramIcon } from "@/components/InstagramIcon";
import type { Platform } from "@/lib/memes/platforms";

/**
 * One small glyph per place a meme can be posted. Facebook and Instagram are the app's own brand glyphs (lucide has
 * none); LINE, TikTok and Other borrow a lucide shape each, which is enough at 16 px beside the platform's name.
 * Server and client components both render it.
 */
export function PlatformIcon({ platform, className = "h-4 w-4" }: { platform: Platform; className?: string }) {
  const props = { "aria-hidden": true, className } as const;
  switch (platform) {
    case "facebook":
      return <FacebookIcon {...props} />;
    case "instagram":
      return <InstagramIcon {...props} />;
    case "line":
      return <MessageCircle {...props} />;
    case "tiktok":
      return <Music2 {...props} />;
    default:
      return <Share2 {...props} />;
  }
}

/**
 * The row of platform glyphs a meme has been shared on, or the "Not shared yet" pill. The names are in the title
 * and the accessible label, so an icon is never the only carrier of the fact.
 */
export function SharedOn({
  platforms,
  names,
  notSharedYet,
  sharedOn,
}: {
  platforms: readonly Platform[];
  names: Record<Platform, string>;
  notSharedYet: string;
  sharedOn: (places: string) => string;
}) {
  if (platforms.length === 0) {
    return (
      <span className="inline-flex items-center rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
        {notSharedYet}
      </span>
    );
  }
  const label = sharedOn(platforms.map((p) => names[p]).join(", "));
  return (
    <span className="inline-flex items-center gap-1 text-success" title={label} aria-label={label}>
      {platforms.map((p) => (
        <PlatformIcon key={p} platform={p} />
      ))}
    </span>
  );
}

import { PuppyAtLaptop } from "@/components/PuppyLoader";

/** A friendly stand-in where a photo is not there yet: the puppy, with the words for screen readers. */
export function EmptyPhoto({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div role="img" aria-label={label} className={`flex h-full w-full items-center justify-center ${className}`}>
      <PuppyAtLaptop className="h-16 w-auto text-site-ink-muted opacity-60" />
    </div>
  );
}

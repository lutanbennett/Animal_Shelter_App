"use client";

import Image from "next/image";
import { useState } from "react";

/** One home-page story photo; if the picture will not load the tile goes away rather than sit blank. */
export function GalleryTile({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <div className="relative aspect-square overflow-hidden rounded-xl bg-site-sand sm:aspect-auto sm:h-[150px]">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 16vw, 33vw"
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { buildIconSvg, type IconStyle } from "@/lib/home-icons/svg";
import { iconFileStem, type CatalogueIcon } from "@/lib/home-icons/catalogue-shared";

type Labels = Record<
  "styleLabel" | "dark" | "light" | "nameLabel" | "withName" | "iconOnly" | "save180" | "save1024" | "address" | "copy" | "copied",
  string
>;

/** Draw the SVG onto a canvas at `size` px and hand back a PNG. */
function toPng(svg: string, size: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = c.height = size;
      c.getContext("2d")!.drawImage(img, 0, 0, size, size);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error("png"))), "image/png");
    };
    img.onerror = () => reject(new Error("svg"));
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
}

async function save(icon: CatalogueIcon, style: IconStyle, showName: boolean, size: number) {
  const svg = buildIconSvg({ inner: icon.inner, label: icon.label, showName, style, size });
  const blob = await toPng(svg, size);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${iconFileStem(icon.label)} ${style} ${size}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
}

export function IconLibrary({ icons, labels: h }: { icons: CatalogueIcon[]; labels: Labels }) {
  const [style, setStyle] = useState<IconStyle>("dark");
  const [showName, setShowName] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const pill = (on: boolean) =>
    `rounded border px-3 py-1.5 text-sm ${on ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground"}`;

  return (
    <>
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2" role="group" aria-label={h.styleLabel}>
          <button type="button" className={pill(style === "dark")} onClick={() => setStyle("dark")}>{h.dark}</button>
          <button type="button" className={pill(style === "light")} onClick={() => setStyle("light")}>{h.light}</button>
        </div>
        <div className="flex items-center gap-2" role="group" aria-label={h.nameLabel}>
          <button type="button" className={pill(showName)} onClick={() => setShowName(true)}>{h.withName}</button>
          <button type="button" className={pill(!showName)} onClick={() => setShowName(false)}>{h.iconOnly}</button>
        </div>
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {icons.map((icon) => {
          const preview = buildIconSvg({ inner: icon.inner, label: icon.label, showName, style, size: 180 });
          const url = typeof window === "undefined" ? icon.path : window.location.origin + icon.path;
          return (
            <li key={icon.path} className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- an in-page SVG data URL */}
              <img
                alt={icon.label}
                width={90}
                height={90}
                className="rounded-[20px]"
                src={"data:image/svg+xml;charset=utf-8," + encodeURIComponent(preview)}
              />
              <p className="font-medium text-foreground">{icon.label}</p>
              <p className="break-all text-xs text-muted">
                {h.address}: {url}
              </p>
              <div className="flex flex-wrap gap-2 text-sm">
                <button type="button" className="rounded border border-border px-2 py-1" onClick={() => save(icon, style, showName, 180)}>{h.save180}</button>
                <button type="button" className="rounded border border-border px-2 py-1" onClick={() => save(icon, style, showName, 1024)}>{h.save1024}</button>
                <button
                  type="button"
                  className="rounded border border-border px-2 py-1"
                  onClick={async () => {
                    await navigator.clipboard.writeText(url).catch(() => {});
                    setCopied(icon.path);
                  }}
                >
                  {copied === icon.path ? h.copied : h.copy}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

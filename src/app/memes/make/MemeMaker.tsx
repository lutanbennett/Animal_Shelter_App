"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ActionButton } from "@/components/ActionButton";
import { ACTION_ICONS } from "@/components/hub-icons";
import { driveImageUrl } from "@/lib/google/drive-client";
import { fitText } from "@/lib/memes/maker-layout";
import type { SourceKind } from "@/lib/memes/sources";
import { createMeme } from "../actions";

type Style = "classic" | "bar" | "bubble";
type Crop = "original" | "square" | "portrait";

const WIDTH = 1080;
const FONT = "MemeThai, 'Noto Sans Thai', sans-serif";
const inputClass =
  "min-h-11 w-full rounded border border-border bg-background px-3 py-2 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";
const labelClass = "text-sm font-medium text-muted";

let fontReady: Promise<void> | null = null;
/** Noto Sans Thai Bold (the font the PDFs embed), loaded once. The browser shapes the text, so ำ and tone marks land right. */
function loadFont(): Promise<void> {
  fontReady ??= import("@/lib/archive/fonts/noto-sans-thai-bold").then(async ({ NOTO_SANS_THAI_BOLD }) => {
    const face = new FontFace("MemeThai", `url(${NOTO_SANS_THAI_BOLD})`, { weight: "700" });
    document.fonts.add(await face.load());
  });
  return fontReady;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image"));
    img.src = src;
  });
}

function draw(
  canvas: HTMLCanvasElement,
  photo: HTMLImageElement,
  logo: HTMLImageElement | null,
  o: { top: string; bottom: string; style: Style; crop: Crop; logoOn: boolean },
) {
  const ratio = o.crop === "square" ? 1 : o.crop === "portrait" ? 5 / 4 : Math.min(1.6, Math.max(0.75, photo.height / photo.width));
  const imgH = Math.round(WIDTH * ratio);
  // Center crop of the source to the target ratio.
  let sw = photo.width;
  let sh = sw * ratio;
  if (sh > photo.height) {
    sh = photo.height;
    sw = sh / ratio;
  }
  const sx = (photo.width - sw) / 2;
  const sy = (photo.height - sh) / 2;

  const ctx = canvas.getContext("2d")!;
  const measureWith = (s: string, size: number) => {
    ctx.font = `700 ${size}px ${FONT}`;
    return ctx.measureText(s).width;
  };
  const pad = 40;
  const maxW = WIDTH - pad * 2;
  const texts = o.style === "bar" ? [o.top, o.bottom].filter((s) => s.trim()).join("\n") : "";
  const bar = o.style === "bar" && texts ? fitText(texts, maxW - 130, 300, measureWith, 64, 28) : null;
  const barH = bar ? Math.round(bar.lines.length * bar.fontSize * 1.2 + pad) : 0;

  canvas.width = WIDTH;
  canvas.height = imgH + barH;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(photo, sx, sy, sw, sh, 0, 0, WIDTH, imgH);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";

  const outlined = (text: string, from: "top" | "bottom", boxH: number, y0: number) => {
    const f = fitText(text, maxW, boxH, measureWith, 110, 30, 1.1);
    ctx.font = `700 ${f.fontSize}px ${FONT}`;
    ctx.lineWidth = Math.max(4, f.fontSize / 7);
    ctx.strokeStyle = "#000";
    ctx.fillStyle = "#fff";
    const lh = f.fontSize * 1.1;
    const start = from === "top" ? y0 + lh / 2 : y0 + boxH - lh * f.lines.length + lh / 2;
    f.lines.forEach((l, i) => {
      ctx.strokeText(l, WIDTH / 2, start + i * lh);
      ctx.fillText(l, WIDTH / 2, start + i * lh);
    });
  };

  if (o.style === "bubble" && o.top.trim()) {
    const f = fitText(o.top, maxW - 80, imgH * 0.3, measureWith, 70, 28);
    const lh = f.fontSize * 1.2;
    const h = f.lines.length * lh + 50;
    const x = 30;
    const y = 30;
    const w = WIDTH - 60;
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 40);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath(); // the tail, pointing down at the animal
    ctx.moveTo(WIDTH / 2 - 40, y + h - 2);
    ctx.lineTo(WIDTH / 2 - 10, y + h + 70);
    ctx.lineTo(WIDTH / 2 + 50, y + h - 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.fillRect(WIDTH / 2 - 36, y + h - 8, 84, 12);
    ctx.font = `700 ${f.fontSize}px ${FONT}`;
    ctx.fillStyle = "#000";
    f.lines.forEach((l, i) => ctx.fillText(l, WIDTH / 2, y + 25 + lh / 2 + i * lh));
  } else if (o.style === "classic" && o.top.trim()) {
    outlined(o.top, "top", imgH * 0.3, 20);
  }
  if (o.style !== "bar" && o.bottom.trim()) outlined(o.bottom, "bottom", imgH * 0.3, imgH - imgH * 0.3 - 20);
  if (bar) {
    ctx.font = `700 ${bar.fontSize}px ${FONT}`;
    ctx.fillStyle = "#000";
    const lh = bar.fontSize * 1.2;
    bar.lines.forEach((l, i) => ctx.fillText(l, (WIDTH - 110) / 2, imgH + pad / 2 + lh / 2 + i * lh));
  }

  if (o.logoOn && logo) {
    const size = 110;
    const x = WIDTH - size - 16;
    const y = canvas.height - size - 16;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.roundRect(x - 6, y - 6, size + 12, size + 12, 14);
    ctx.fill();
    ctx.drawImage(logo, x, y, size, size);
  }
}

/**
 * The maker: pick words, style and crop, watch the preview, save. The picture is drawn on a canvas in the browser with
 * Noto Sans Thai, then sent to the same createMeme the library uses, with `sourceFileId` so the server re-checks the
 * photo (Medical is refused there) and tags its residents. The original photo is only read, never written.
 */
export function MemeMaker({
  photoSrc,
  sourceKind,
  sourceFileId,
  residentLabel,
}: {
  /** What to draw: the photo route for a filed photo, or a blob: URL for an uploaded one (never sent anywhere). */
  photoSrc: string;
  sourceKind: SourceKind;
  /** The Drive file the photo came from; null for an upload, which is filed against nothing. */
  sourceFileId: string | null;
  residentLabel: string;
}) {
  const { t } = useI18n();
  const m = t.memes.maker;
  const router = useRouter();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [top, setTop] = useState("");
  const [bottom, setBottom] = useState("");
  const [style, setStyle] = useState<Style>("classic");
  const [crop, setCrop] = useState<Crop>("square");
  const [logoOn, setLogoOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let alive = true;
    Promise.all([loadFont(), loadImage(photoSrc), loadImage("/lca-logo.jpg").catch(() => null)])
      .then(([, p, l]) => {
        if (!alive) return;
        setPhoto(p);
        setLogo(l);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [photoSrc]);

  useEffect(() => {
    if (photo && canvas.current) draw(canvas.current, photo, logo, { top, bottom, style, crop, logoOn });
  }, [photo, logo, top, bottom, style, crop, logoOn]);

  const save = useCallback(() => {
    const c = canvas.current;
    if (!c) return;
    setError(null);
    startTransition(async () => {
      const blob = await new Promise<Blob | null>((res) => c.toBlob(res, "image/jpeg", 0.9));
      if (!blob) return setError(m.loadFailed);
      const words = [top, bottom].map((s) => s.trim()).filter(Boolean).join(" / ");
      const title = (words || m.defaultTitle(residentLabel)).slice(0, 120);
      const data = new FormData();
      data.set("title", title);
      data.set("captionEn", words.slice(0, 2000));
      data.set("captionTh", "");
      data.set("tags", "meme maker");
      data.set("sourceKind", sourceKind);
      if (sourceFileId) data.set("sourceFileId", sourceFileId);
      data.set("file", new File([blob], "meme.jpg", { type: "image/jpeg" }));
      const result = await createMeme(data);
      if (!result.ok) return setError(result.error);
      router.push(`/memes/${result.id}`);
    });
  }, [top, bottom, sourceKind, sourceFileId, residentLabel, router, m]);

  const choice = <T extends string>(label: string, value: T, set: (v: T) => void, options: [T, string][]) => (
    <fieldset className="flex flex-col gap-1">
      <legend className={labelClass}>{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([v, text]) => (
          <button
            key={v}
            type="button"
            aria-pressed={value === v}
            onClick={() => set(v)}
            className={`min-h-11 rounded border px-3 py-2 text-sm font-medium ${
              value === v ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:bg-surface-hover"
            }`}
          >
            {text}
          </button>
        ))}
      </div>
    </fieldset>
  );

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <p className="text-sm text-muted">
        {residentLabel ? `${residentLabel} · ` : ""}
        {m.originalUnchanged}
      </p>
      <div className="overflow-hidden rounded border border-border bg-surface-hover">
        {failed ? (
          <p role="alert" className="p-4 text-base text-danger">{m.loadFailed}</p>
        ) : !photo ? (
          <p className="p-4 text-base text-muted">{m.loading}</p>
        ) : null}
        <canvas ref={canvas} aria-label={m.preview} className={photo ? "block h-auto w-full" : "hidden"} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="maker-top" className={labelClass}>{m.top}</label>
        <textarea id="maker-top" rows={2} value={top} onChange={(e) => setTop(e.target.value)} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="maker-bottom" className={labelClass}>{m.bottom}</label>
        <textarea id="maker-bottom" rows={2} value={bottom} onChange={(e) => setBottom(e.target.value)} className={inputClass} />
      </div>
      {choice<Style>(m.style, style, setStyle, [["classic", m.styles.classic], ["bar", m.styles.bar], ["bubble", m.styles.bubble]])}
      {choice<Crop>(m.crop, crop, setCrop, [["square", m.crops.square], ["portrait", m.crops.portrait], ["original", m.crops.original]])}
      <label className="flex min-h-11 items-center gap-3 text-base text-foreground">
        <input type="checkbox" checked={logoOn} onChange={(e) => setLogoOn(e.target.checked)} className="h-5 w-5" />
        {m.logo}
      </label>

      {error && <p role="alert" className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
      <ActionButton icon={ACTION_ICONS.add} variant="primary" onClick={save} disabled={pending || !photo}>
        {pending ? m.saving : m.save}
      </ActionButton>
    </div>
  );
}

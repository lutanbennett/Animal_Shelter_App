import { Droplet } from "lucide-react";

/** Most icons drawn before the count alone takes over, so a row never grows wide. */
const MAX_ICONS = 6;

function Tablet({ half = false }: { half?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9 shrink-0" aria-hidden>
      {half ? (
        <path d="M12 3a9 9 0 0 0 0 18z" className="fill-background stroke-foreground" strokeWidth="2" />
      ) : (
        <>
          <circle cx="12" cy="12" r="9" className="fill-background stroke-foreground" strokeWidth="2" />
          <line x1="5" y1="12" x2="19" y2="12" className="stroke-foreground" strokeWidth="1.5" />
        </>
      )}
    </svg>
  );
}

function Capsule() {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9 shrink-0" aria-hidden>
      <g transform="rotate(-45 12 12)">
        <rect x="2" y="7.5" width="20" height="9" rx="4.5" className="fill-background stroke-foreground" strokeWidth="2" />
        <rect x="12" y="7.5" width="10" height="9" rx="4.5" className="fill-foreground stroke-foreground" strokeWidth="2" />
      </g>
    </svg>
  );
}

/** Syringe whose plunger sits at the dose: the mark to draw up to, against a scale that fits it. */
function Syringe({ ml }: { ml: number }) {
  const scale = [1, 2, 3, 5, 10, 20].find((s) => ml <= s) ?? Math.ceil(ml);
  const fill = Math.max(0.05, Math.min(1, ml / scale));
  const barrel = 56; // viewBox units of barrel length
  const filled = barrel * fill;
  return (
    <svg viewBox="0 0 80 24" className="h-9 w-24 shrink-0" aria-hidden>
      <line x1="2" y1="12" x2="12" y2="12" className="stroke-foreground" strokeWidth="2" />
      <rect x="12" y="5" width={barrel} height="14" rx="2" className="fill-background stroke-foreground" strokeWidth="2" />
      <rect x="12" y="5" width={filled} height="14" rx="2" className="fill-foreground opacity-30" />
      <line x1={12 + filled} y1="3" x2={12 + filled} y2="21" className="stroke-foreground" strokeWidth="3" />
      <line x1={12 + barrel} y1="12" x2="78" y2="12" className="stroke-foreground" strokeWidth="2" />
      <line x1="78" y1="6" x2="78" y2="18" className="stroke-foreground" strokeWidth="2" />
    </svg>
  );
}

/**
 * The amount of one dose as a picture, with the number beside it (numerals read in any
 * language) and the unit in words after it as the fallback. Tablets and capsules are drawn
 * one per unit, a half as a half-disc; liquids as a syringe filled to the mark; drops as drops.
 * Other units (mg, sachet, ...) have no honest drawing, so they show the number and unit only.
 */
export function AmountPicture({
  quantity,
  unit,
  text,
}: {
  quantity: number | null;
  unit: string;
  /** The formatted words, "2 tablet(s)", or the "not recorded" message. */
  text: string;
}) {
  const drawable = quantity != null && quantity > 0;
  let art: React.ReactNode = null;
  if (drawable && (unit === "tablet" || unit === "capsule")) {
    const whole = Math.floor(quantity);
    const half = quantity - whole >= 0.25;
    if (whole + (half ? 1 : 0) <= MAX_ICONS) {
      const One = unit === "capsule" ? Capsule : Tablet;
      art = (
        <span className="flex flex-wrap items-center gap-0.5">
          {Array.from({ length: whole }, (_, i) => (
            <One key={i} />
          ))}
          {half && <Tablet half />}
        </span>
      );
    } else {
      art = unit === "capsule" ? <Capsule /> : <Tablet />;
    }
  } else if (drawable && unit === "ml") {
    art = <Syringe ml={quantity} />;
  } else if (drawable && unit === "drop") {
    art =
      quantity <= MAX_ICONS ? (
        <span className="flex flex-wrap items-center gap-0.5">
          {Array.from({ length: Math.ceil(quantity) }, (_, i) => (
            <Droplet key={i} aria-hidden className="h-7 w-7 fill-foreground text-foreground" />
          ))}
        </span>
      ) : (
        <Droplet aria-hidden className="h-7 w-7 fill-foreground text-foreground" />
      );
  }

  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1" role="group" aria-label={text}>
      {art}
      <span className="break-words text-lg font-semibold text-foreground">
        {drawable ? (art ? `× ${Number(quantity)}` : text) : text}
      </span>
      {drawable && art && <span className="text-sm text-muted">{text.replace(/^[\d.]+\s*/, "")}</span>}
    </span>
  );
}

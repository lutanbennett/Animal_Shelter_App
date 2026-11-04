import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { Locale } from "@/lib/i18n/locales";
import { formatBahtExact } from "@/lib/format";
import { fillFraction, overBy, percentRaised } from "@/lib/appeals/state";

export type ProgressStyle = "bar" | "thermometer" | "gauge";

/**
 * How far an appeal has got, drawn three ways (bar, thermometer, gauge) as plain
 * inline SVG / CSS in the public site's colours, no chart library. It is
 * server-rendered and takes no browser APIs, so the staff form's live preview
 * can use it too.
 *
 * Whatever the picture, the same three facts are always in words beside it:
 * raised, goal, percent. The drawing is `aria-hidden`; a screen reader, a
 * reader of Thai and anyone who cannot judge a needle get the numbers. Over
 * 100% the picture is simply full and the words say by how much; at 0 it is
 * empty and a sentence says so. The raised figure is only ever recorded
 * gifts, and the percent rounds down (state.ts).
 */
export function AppealProgressDisplay({
  style,
  raised,
  target,
  locale,
  t,
  compact = false,
}: {
  style: ProgressStyle;
  raised: number;
  target: number;
  locale: Locale;
  t: Dictionary;
  /** The list's version: a bar and one line of words, whatever the style. */
  compact?: boolean;
}) {
  const p = t.appeals.progress;
  const fraction = fillFraction(raised, target);
  const percent = percentRaised(raised, target);
  const over = overBy(raised, target);
  const money = (n: number) => formatBahtExact(n, locale);

  const sentence =
    raised <= 0 ? p.none : over > 0 ? p.over(money(raised), money(over)) : p.raisedOfGoal(money(raised), money(target));

  if (compact || style === "bar") {
    return (
      <div className="flex flex-col gap-2">
        <div
          aria-hidden
          className="h-3.5 w-full overflow-hidden rounded-full border border-site-line bg-site-sand"
        >
          <div className="h-full rounded-full bg-site-accent" style={{ width: `${Math.round(fraction * 1000) / 10}%` }} />
        </div>
        <p className="text-[15px] leading-snug text-site-ink">
          <span className="font-bold">{sentence}</span>
          {raised > 0 && <span className="text-site-ink-soft"> · {p.percent(percent)}</span>}
        </p>
      </div>
    );
  }

  const facts = (
    <dl className="grid min-w-[9rem] flex-1 grid-cols-1 gap-3">
      <div>
        <dt className="text-[13px] text-site-ink-muted">{p.raised}</dt>
        <dd className="font-display text-3xl font-bold tabular-nums text-site-ink">{money(raised)}</dd>
      </div>
      <div>
        <dt className="text-[13px] text-site-ink-muted">{p.goal}</dt>
        <dd className="text-xl font-bold tabular-nums text-site-ink">{money(target)}</dd>
      </div>
      <div>
        <dt className="text-[13px] text-site-ink-muted">{p.funded}</dt>
        <dd className="text-xl font-bold tabular-nums text-site-ink">{p.percent(percent)}</dd>
      </div>
      {(raised <= 0 || over > 0) && (
        <p className="text-[15px] font-semibold text-site-ink-soft">{sentence}</p>
      )}
    </dl>
  );

  return (
    <div className="flex flex-wrap items-center gap-6">
      {style === "thermometer" ? <Thermometer fraction={fraction} /> : <Gauge fraction={fraction} />}
      {facts}
    </div>
  );
}

const TUBE_TOP = 12;
const TUBE_HEIGHT = 168;

function Thermometer({ fraction }: { fraction: number }) {
  const fill = TUBE_HEIGHT * fraction;
  return (
    <svg aria-hidden viewBox="0 0 80 250" className="h-56 w-auto shrink-0" focusable="false">
      <defs>
        <clipPath id="appeal-thermo-clip">
          <rect x="28" y={TUBE_TOP} width="24" height={TUBE_HEIGHT + 20} rx="12" />
          <circle cx="40" cy="214" r="26" />
        </clipPath>
      </defs>
      <g clipPath="url(#appeal-thermo-clip)">
        <rect x="0" y="0" width="80" height="250" className="fill-site-sand" />
        {/* The bulb is always lit once there is anything raised; the column rises with the money. */}
        <rect
          x="0"
          y={TUBE_TOP + TUBE_HEIGHT - fill}
          width="80"
          height={fill + 80}
          className={fraction > 0 ? "fill-site-accent" : "fill-transparent"}
        />
      </g>
      <rect
        x="28"
        y={TUBE_TOP}
        width="24"
        height={TUBE_HEIGHT + 20}
        rx="12"
        className="fill-none stroke-site-line-strong"
        strokeWidth="2"
      />
      <circle cx="40" cy="214" r="26" className="fill-none stroke-site-line-strong" strokeWidth="2" />
      {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
        <line
          key={tick}
          x1="58"
          x2={tick === 0 || tick === 1 ? 72 : 66}
          y1={TUBE_TOP + TUBE_HEIGHT - TUBE_HEIGHT * tick}
          y2={TUBE_TOP + TUBE_HEIGHT - TUBE_HEIGHT * tick}
          className="stroke-site-line-strong"
          strokeWidth="2"
        />
      ))}
    </svg>
  );
}

function Gauge({ fraction }: { fraction: number }) {
  const angle = -90 + 180 * fraction;
  return (
    <svg aria-hidden viewBox="0 0 220 130" className="h-32 w-auto shrink-0" focusable="false">
      <path
        d="M 20 110 A 90 90 0 0 1 200 110"
        pathLength={100}
        fill="none"
        strokeWidth="18"
        strokeLinecap="round"
        className="stroke-site-sand"
      />
      {fraction > 0 && (
        <path
          d="M 20 110 A 90 90 0 0 1 200 110"
          pathLength={100}
          fill="none"
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={`${fraction * 100} 100`}
          className="stroke-site-accent"
        />
      )}
      <g transform={`rotate(${angle} 110 110)`}>
        <line x1="110" y1="110" x2="110" y2="36" strokeWidth="4" strokeLinecap="round" className="stroke-site-ink" />
      </g>
      <circle cx="110" cy="110" r="8" className="fill-site-ink" />
    </svg>
  );
}

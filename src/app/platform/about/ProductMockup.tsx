/**
 * A small picture of one screen of the product, drawn in markup from invented sample data (#cjlnd). It stands in for a
 * screenshot on purpose: every captured screenshot carries a real shelter's header, and several a real animal's name,
 * and this page names no shelter. Being text, it also reads in Thai, costs no image weight and follows light and dark.
 * Decorative only: the band beside it says the same thing in words, so it is hidden from assistive technology.
 */
export type Mock = { title: string; sub: string; rows: string[][]; tags: string[] };

export function ProductMockup({ mock }: { mock: Mock }) {
  return (
    <div aria-hidden="true" className="w-full overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
      </div>
      <div className="p-5">
        <p className="text-lg font-semibold text-foreground">{mock.title}</p>
        <p className="text-sm text-muted">{mock.sub}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3">
          {mock.rows.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-border px-3 py-2">
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="text-sm font-medium text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          {mock.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-white">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

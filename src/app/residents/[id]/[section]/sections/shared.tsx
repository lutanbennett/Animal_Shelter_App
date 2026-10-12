export function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
      {children}
    </p>
  );
}

export function RecordList<T extends { id: string }>({
  rows,
  empty,
  render,
}: {
  rows: T[];
  empty: string;
  render: (row: T) => React.ReactNode;
}) {
  if (rows.length === 0) return <Placeholder>{empty}</Placeholder>;
  return (
    <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface">
      {rows.map((row) => (
        <li key={row.id} className="px-4 py-3 text-sm text-foreground">
          {render(row)}
        </li>
      ))}
    </ul>
  );
}

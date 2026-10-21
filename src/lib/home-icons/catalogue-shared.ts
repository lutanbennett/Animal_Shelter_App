export type CatalogueIcon = { path: string; label: string; inner: string };

export function iconFileStem(label: string): string {
  return label.replace(/[\\/:*?"<>|]/g, "").trim();
}

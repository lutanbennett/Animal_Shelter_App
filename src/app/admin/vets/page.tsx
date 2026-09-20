import { redirect } from "next/navigation";

/** Vets management moved to the Management section (2026-09-21). */
export default function AdminVetsPage() {
  redirect("/management/vets");
}

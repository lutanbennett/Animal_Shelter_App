import { redirect } from "next/navigation";

/** Contact management moved to the Management section (2026-09-21). */
export default function AdminContactsPage() {
  redirect("/management/contacts");
}

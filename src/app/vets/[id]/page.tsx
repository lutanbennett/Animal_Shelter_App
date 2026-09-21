import { notFound } from "next/navigation";
import { canManage } from "@/lib/auth/require-management";
import { createClient } from "@/lib/supabase/server";
import {
  VetHub,
  type LinkedRecord,
  type Vet,
  type VetHubVisit,
} from "./VetHub";

export default async function VetPage(props: PageProps<"/vets/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();

  // Records logged against this vet's visits are counted on the hub. Each
  // is fetched through its vet_appointment_id with an inner join filtered
  // on the vet, so one round-trip per table and no id list in the URL.
  const linkedSelect = "id, vet_appointment_id, vet_appointments!inner(vet_id)";

  const [vetResult, visitsResult, proceduresResult, bloodTestsResult, prescriptionsResult, roleResult] =
    await Promise.all([
      supabase
        .from("vets")
        .select("id, name, clinic_name, contact_info, notes")
        .eq("id", id)
        .limit(1)
        .returns<Vet[]>(),
      supabase
        .from("vet_appointments")
        .select(
          "id, resident_id, appointment_date, status, reason, cost, residents(name, thai_name, resident_code)",
        )
        .eq("vet_id", id)
        .order("appointment_date", { ascending: false })
        .returns<VetHubVisit[]>(),
      supabase
        .from("procedures")
        .select(linkedSelect)
        .eq("vet_appointments.vet_id", id)
        .returns<LinkedRecord[]>(),
      supabase
        .from("blood_tests")
        .select(linkedSelect)
        .eq("vet_appointments.vet_id", id)
        .returns<LinkedRecord[]>(),
      supabase
        .from("prescriptions")
        .select(linkedSelect)
        .eq("vet_appointments.vet_id", id)
        .returns<LinkedRecord[]>(),
      supabase.rpc("current_user_role"),
    ]);

  // A query error must not look like a missing vet — surface it, not a 404.
  if (vetResult.error) throw new Error(vetResult.error.message);
  const vet = vetResult.data?.[0];
  if (!vet) notFound();
  if (visitsResult.error) throw new Error(visitsResult.error.message);

  return (
    <VetHub
      vet={vet}
      visits={visitsResult.data ?? []}
      linked={{
        procedures: proceduresResult.data ?? [],
        bloodTests: bloodTestsResult.data ?? [],
        prescriptions: prescriptionsResult.data ?? [],
      }}
      canManage={canManage(roleResult.data)}
      now={new Date().toISOString()}
    />
  );
}

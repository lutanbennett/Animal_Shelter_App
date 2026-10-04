import { requireFullResident } from "@/lib/residents/who-and-where";
import { AdoptionUpdatePage } from "../../AdoptionUpdatePage";

export default async function EditAdoptionUpdatePage(
  props: PageProps<"/residents/[id]/adoption-updates/[updateId]/edit">,
) {
  await requireFullResident();
  const { id, updateId } = await props.params;
  return <AdoptionUpdatePage residentId={id} updateId={updateId} />;
}

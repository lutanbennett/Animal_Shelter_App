import { AdoptionUpdatePage } from "../../AdoptionUpdatePage";

export default async function EditAdoptionUpdatePage(
  props: PageProps<"/residents/[id]/adoption-updates/[updateId]/edit">,
) {
  const { id, updateId } = await props.params;
  return <AdoptionUpdatePage residentId={id} updateId={updateId} />;
}

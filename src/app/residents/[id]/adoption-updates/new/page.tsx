import { AdoptionUpdatePage } from "../AdoptionUpdatePage";

export default async function NewAdoptionUpdatePage(
  props: PageProps<"/residents/[id]/adoption-updates/new">,
) {
  const { id } = await props.params;
  return <AdoptionUpdatePage residentId={id} updateId={null} />;
}

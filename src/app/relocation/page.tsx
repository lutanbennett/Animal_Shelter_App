import { PuppyFlying } from "@/components/PuppyLoader";
import { SitePageView, sitePageMetadata } from "../adopt/SitePageView";

export const generateMetadata = () => sitePageMetadata("relocation");

export default function Page() {
  return (
    <SitePageView
      slug="relocation"
      section="relocation"
      hero={<PuppyFlying className="h-auto w-full" />}
    />
  );
}

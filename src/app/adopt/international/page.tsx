import { PuppyOverGlobe } from "@/components/PuppyLoader";
import { SitePageView, sitePageMetadata } from "../SitePageView";

export const generateMetadata = () => sitePageMetadata("international-adoption");

export default function Page() {
  return (
    <SitePageView
      slug="international-adoption"
      section="adopt-international"
      hero={<PuppyOverGlobe className="h-auto w-full" />}
    />
  );
}

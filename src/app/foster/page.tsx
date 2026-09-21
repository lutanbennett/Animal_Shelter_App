import { SitePageView, sitePageMetadata } from "../adopt/SitePageView";

export const generateMetadata = () => sitePageMetadata("foster");

export default function Page() {
  return <SitePageView slug="foster" section="foster" />;
}

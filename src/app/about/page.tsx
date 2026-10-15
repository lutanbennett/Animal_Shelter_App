import { SitePageView, sitePageMetadata } from "../adopt/SitePageView";

export const generateMetadata = () => sitePageMetadata("about");

export default function Page() {
  return <SitePageView slug="about" section="about" />;
}

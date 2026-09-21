import { SitePageView, sitePageMetadata } from "../adopt/SitePageView";

export const generateMetadata = () => sitePageMetadata("donate");

export default function Page() {
  return <SitePageView slug="donate" section="donate" />;
}

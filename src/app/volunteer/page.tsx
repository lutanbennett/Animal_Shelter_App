import { SitePageView, sitePageMetadata } from "../adopt/SitePageView";

export const generateMetadata = () => sitePageMetadata("volunteer");

export default function Page() {
  return <SitePageView slug="volunteer" section="volunteer" />;
}

import { SitePageView, sitePageMetadata } from "../../adopt/SitePageView";

export const generateMetadata = () => sitePageMetadata("shelter-friends-join");

export default function Page() {
  return <SitePageView slug="shelter-friends-join" section="friends-join" />;
}

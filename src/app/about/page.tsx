import { SitePageView, sitePageMetadata } from "../adopt/SitePageView";
import { Registration } from "./Registration";

export const generateMetadata = () => sitePageMetadata("about");

export default function Page() {
  return <SitePageView slug="about" section="about" afterIntro={<Registration />} />;
}

import { DonateWays } from "./DonateWays";
import { GiftSplit } from "./GiftSplit";
import { ShopMention } from "./ShopMention";
import { SitePageView, sitePageMetadata } from "../adopt/SitePageView";

export const generateMetadata = () => sitePageMetadata("donate");

export default function Page() {
  return (
    <SitePageView
      slug="donate"
      section="donate"
      afterIntro={
        <>
          <DonateWays />
          <GiftSplit />
          <ShopMention />
        </>
      }
    />
  );
}

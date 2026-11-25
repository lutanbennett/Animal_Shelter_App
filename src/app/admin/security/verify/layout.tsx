import type { Metadata } from "next";

/**
 * The second step is owned by the person's login, not by a shelter, so its page is bare: no logo,
 * no menu, no links (PublicPathGate hides the chrome for this path). The tab title is the other
 * half of that. The root layout titles every page with shelterNames(), which reads the shelter the
 * HOST maps to, so without this the tab would name a shelter on the product's own host.
 * `absolute` also stops a title template from adding one. Not indexed, like /login.
 */
export const metadata: Metadata = {
  title: { absolute: "2-step verification" },
  robots: { index: false, follow: false },
};

export default function TwoStepLayout({ children }: { children: React.ReactNode }) {
  return children;
}

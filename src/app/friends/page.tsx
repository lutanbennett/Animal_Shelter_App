import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { driveImageUrl } from "@/lib/google/drive-client";
import { getT } from "@/lib/i18n/get-t";
import { getSiteOrigin } from "@/lib/site-origin";
import { friendMapSources, loadPublicFriends } from "@/lib/shelter-friends/public";
import { staffDraftFriends } from "@/lib/shelter-friends/staff-drafts";
import { FriendCard } from "@/components/FriendCard";
import { PublicHeader } from "../adopt/PublicHeader";
import { PublicFooter } from "../adopt/PublicFooter";

/**
 * Open Graph for /friends. The first Friend's logo is the share image when
 * there is one — a link posted in a supporters' group then previews with
 * a face the business will recognise.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [supabase, { t, locale }, origin] = await Promise.all([
    createClient(),
    getT(),
    getSiteOrigin(),
  ]);
  const { friends } = await loadPublicFriends(supabase);
  const f = t.shelterFriends;
  const title = `${f.pageTitle} · ${t.header.appName}`;
  const description = f.shareFallback;
  const logo = friends.find((friend) => friend.logo_drive_file_id)?.logo_drive_file_id;
  const image = logo ? driveImageUrl(logo) : undefined;

  return {
    title,
    description,
    ...(origin ? { metadataBase: origin } : {}),
    openGraph: {
      type: "website",
      title,
      description,
      url: "/friends",
      siteName: t.header.appName,
      locale: locale === "th" ? "th_TH" : "en_GB",
      ...(image ? { images: [{ url: image, alt: f.pageTitle }] } : {}),
    },
    twitter: {
      card: "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

/**
 * /friends — the businesses that help the shelter, thanked in public.
 * Everything on it comes from public_shelter_friends (0076): only
 * published profiles of live contacts, and each contact detail only when
 * its opt-in box was ticked. This page never reads contacts or
 * shelter_friends; if it needs something the view doesn't give, the view
 * is what changes. The one exception is staffDraftFriends(): a count, for
 * signed-in staff only, of drafts that are why the page looks empty.
 */
export default async function FriendsPage() {
  const supabase = await createClient();
  const { t, locale } = await getT();
  const f = t.shelterFriends;

  const [{ friends, error }, drafts] = await Promise.all([
    loadPublicFriends(supabase),
    staffDraftFriends(supabase),
  ]);
  const maps = await friendMapSources(friends);

  return (
    <main className="flex flex-1 flex-col">
      <PublicHeader current="friends" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:px-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-foreground">{f.pageTitle}</h1>
          <p className="max-w-2xl text-sm text-muted">{f.pageSubtitle}</p>
        </div>

        {drafts && (
          <p className="rounded border border-dashed border-primary/40 bg-background px-4 py-3 text-sm text-foreground">
            <span className="block text-xs font-medium text-muted">{f.staffDrafts.label}</span>
            {f.staffDrafts.count(drafts.count)}{" "}
            {drafts.canPublish ? (
              <>
                {f.staffDrafts.publishFrom}{" "}
                <Link href="/management/shelter-friends" className="text-primary hover:underline">
                  {f.staffDrafts.manageLink}
                </Link>
                .
              </>
            ) : (
              f.staffDrafts.askManager
            )}
          </p>
        )}

        {error && (
          <p className="text-sm text-danger">
            {f.couldntLoad}: {error}
          </p>
        )}

        {!error && friends.length === 0 && (
          <p className="rounded border border-border bg-surface p-6 text-center text-sm text-muted">
            {f.noneYet}
          </p>
        )}

        <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 lg:grid-cols-3">
          {friends.map((friend) => (
            <FriendCard
              key={friend.id}
              friend={friend}
              t={t}
              locale={locale}
              mapSrc={maps.get(friend.id) ?? null}
            />
          ))}
        </div>
      </div>

      <PublicFooter />
    </main>
  );
}

import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/get-t";
import { isPlatformHostname, platformHost, requestHost } from "@/lib/site-hosts";
import { EnquiryForm } from "./EnquiryForm";

/**
 * The enquiry form (#shsup): the one page on the platform front door a stranger may reach. No sign-in and no
 * product-admin check (the console beside it keeps both). It keeps the host check, so where PLATFORM_HOST is set a
 * shelter's own address answers not-found. It lists nothing and reads no table.
 */
export default async function EnquirePage() {
  const h = await headers();
  if (platformHost() && !isPlatformHostname(requestHost((n) => h.get(n)) ?? "")) notFound();
  const { t } = await getT();
  const e = t.admin.productAdmin.enquiry;
  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{e.title}</h1>
        <p className="max-w-prose text-sm text-muted">{e.intro}</p>
      </div>
      <EnquiryForm t={e} />
    </main>
  );
}

import { redirect } from "next/navigation";

// proxy.ts already redirects "/" based on the auth cookie; this is the fallback
// for the rare case proxy is bypassed (e.g. a direct fetch with no cookies sent).
export default function RootPage() {
  redirect("/login");
}

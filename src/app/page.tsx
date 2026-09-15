import { permanentRedirect } from "next/navigation";

export default function RootPage() {
  // 308 (permanent) rather than the default 307 (temporary) — "/" always
  // points to "/landing", so search engines should consolidate ranking
  // signals onto the canonical URL instead of treating this as a
  // transient redirect.
  permanentRedirect("/landing");
}

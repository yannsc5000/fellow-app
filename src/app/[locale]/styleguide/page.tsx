import type { Metadata } from "next";
import { Styleguide } from "@/components/Styleguide";

// Internal design reference — not indexed, not in the sitemap.
export const metadata: Metadata = {
  title: "Fellow — Living Styleguide",
  robots: { index: false, follow: false },
};

export default function StyleguidePage() {
  return <Styleguide />;
}

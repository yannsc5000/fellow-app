import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware navigation helpers. Use these <Link>/router in place of next/link so links keep the
// current locale (/es/…) automatically.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);

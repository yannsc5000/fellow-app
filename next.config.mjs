/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // drop the X-Powered-By response header (tiny, tidy)
  experimental: {
    // Static generation of the ~2,900 city/fellowship pages spawns one worker per CPU,
    // and EACH worker parses the full meetings dataset — several copies at once OOM the
    // Vercel build (SIGKILL). Force a single worker so only one copy is ever in memory.
    workerThreads: false,
    cpus: 1,
  },
  // Friendly redirect: the sitemap lives at /sitemap.xml, but /sitemap is a natural guess.
  async redirects() {
    return [{ source: "/sitemap", destination: "/sitemap.xml", permanent: true }];
  },
};
export default nextConfig;

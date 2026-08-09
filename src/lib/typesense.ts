// Search-only Typesense adapter for InstantSearch (browser-safe).
import TypesenseInstantSearchAdapter from "typesense-instantsearch-adapter";

export const typesenseAdapter = new TypesenseInstantSearchAdapter({
  server: {
    // Defaults to the local dev key so `npm run bootstrap:local && npm run dev`
    // works with zero .env setup. Set a scoped search-only key in production.
    apiKey: process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_API_KEY || "devkey",
    nodes: [
      {
        host: process.env.NEXT_PUBLIC_TYPESENSE_HOST || "localhost",
        port: Number(process.env.NEXT_PUBLIC_TYPESENSE_PORT || 8108),
        protocol: process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL || "http",
      },
    ],
    cacheSearchResultsForSeconds: 2 * 60,
  },
  // query text is matched against these fields
  additionalSearchParameters: {
    query_by: "name,place,address,notes",
    sort_by: "dist:asc",
  },
  geoLocationField: "_geoloc",
});

export const searchClient = typesenseAdapter.searchClient;

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
    // include fellowship name + synonyms so "overeaters" finds OA, etc.
    query_by: "name,place,address,notes,fellowship,fellowship_name,fellowship_terms,types",
    sort_by: "day:asc,time:asc",   // flat chronological weekly order
    // Require all query tokens to match — never drop a token. Prevents "San Francisco" from
    // falling back to "San" and returning San Antonio/San Diego when SF coverage is thin.
    drop_tokens_threshold: 0,
  },
  geoLocationField: "_geoloc",
});

export const searchClient = typesenseAdapter.searchClient;

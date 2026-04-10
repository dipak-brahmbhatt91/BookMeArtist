import { Helmet } from "react-helmet-async";
import { APP_BASE_URL } from "@/lib/api-base";

const SITE_NAME = "BookMeArtist";
const BASE_URL = APP_BASE_URL;
const DEFAULT_IMAGE = `${BASE_URL}/opengraph.jpg`;

interface PageSeoProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: "website" | "profile" | "article";
  noindex?: boolean;
  schema?: object | object[];
}

export function PageSeo({
  title,
  description = "Discover and book verified creative talent across India — musicians, photographers, dancers, and performers for weddings, corporate events, and more. No agency fees.",
  canonical,
  image = DEFAULT_IMAGE,
  type = "website",
  noindex = false,
  schema,
}: PageSeoProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Book Verified Musicians, Photographers & Performers`;
  const canonicalUrl = canonical
    ? canonical.startsWith("http") ? canonical : `${BASE_URL}${canonical}`
    : BASE_URL;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(schema) ? { "@context": "https://schema.org", "@graph": schema } : schema)}
        </script>
      )}
    </Helmet>
  );
}

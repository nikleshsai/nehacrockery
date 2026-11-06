import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Neha Crockery House';

interface SeoProps {
  title: string;
  description?: string;
  /** Path (e.g. "/products"); used for the canonical URL. Defaults to the current path. */
  path?: string;
  image?: string;
  noindex?: boolean;
}

/** Per-page <title>, meta description, canonical URL and social tags. */
export function Seo({ title, description, path, image, noindex }: SeoProps) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const canonicalPath = path ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
  const canonical = `${origin}${canonicalPath}`;
  const img = image ?? `${origin}/assets/images/logo.jpeg`;

  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={img} />
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
  );
}

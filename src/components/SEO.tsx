import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOProps {
    title: string;
    description?: string;
    image?: string;
    url?: string;
    canonical?: string;
    keywords?: string[];
    noIndex?: boolean;
    type?: 'website' | 'article' | 'profile';
    structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
}

const BRAND_NAME = 'StudyShare';
const DEFAULT_SITE_URL = 'https://studyshare.in';

const getSiteUrl = () => {
    const envUrl = import.meta.env.VITE_SITE_URL as string | undefined;
    if (envUrl) return envUrl.replace(/\/+$/, '');
    if (typeof window !== 'undefined' && window.location.origin) {
        return window.location.origin.replace(/\/+$/, '');
    }
    return DEFAULT_SITE_URL;
};

const toAbsoluteUrl = (value: string, siteUrl: string) => {
    if (/^https?:\/\//i.test(value)) return value;
    const normalized = value.startsWith('/') ? value : `/${value}`;
    return `${siteUrl}${normalized}`;
};

export const SEO = ({
    title,
    description = "Community Learning Platform - Access study materials, notes, and connect with your college community.",
    image = "/favicon.png",
    url,
    canonical,
    keywords,
    noIndex = false,
    type = "website",
    structuredData,
}: SEOProps) => {
    const location = useLocation();
    const siteUrl = getSiteUrl();
    const routePath = location.pathname;
    const resolvedUrl = toAbsoluteUrl(canonical || url || routePath, siteUrl);
    const imageUrl = toAbsoluteUrl(image, siteUrl);
    const fullTitle = title.includes(BRAND_NAME) ? title : `${title} | ${BRAND_NAME}`;
    const robots = noIndex
        ? "noindex, nofollow, noarchive"
        : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";
    const structuredDataItems = structuredData
        ? (Array.isArray(structuredData) ? structuredData : [structuredData])
        : [];

    return (
        <Helmet>
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        <meta name="application-name" content={BRAND_NAME} />
        <meta name="robots" content={robots} />
        <meta name="googlebot" content={robots} />
        <link rel="canonical" href={resolvedUrl} />
        {keywords && keywords.length > 0 && (
            <meta name="keywords" content={keywords.join(', ')} />
        )}

        {/* Open Graph / Facebook */}
        <meta property="og:type" content={type} />
        <meta property="og:site_name" content={BRAND_NAME} />
        <meta property="og:locale" content="en_US" />
        <meta property="og:url" content={resolvedUrl} />
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:image:alt" content={`${BRAND_NAME} preview`} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={resolvedUrl} />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={imageUrl} />

        {structuredDataItems.map((item, idx) => (
            <script key={`seo-jsonld-${idx}`} type="application/ld+json">
                {JSON.stringify(item)}
            </script>
        ))}
        </Helmet>
    );
};

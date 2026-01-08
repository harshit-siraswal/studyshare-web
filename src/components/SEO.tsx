import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description?: string;
    image?: string;
    url?: string;
}

/**
 * SEO component for dynamic meta tags.
 * Improves social sharing (Open Graph) and Google indexing.
 * 
 * @example
 * <SEO 
 *   title="Study Materials" 
 *   description="Access curated notes, videos, and previous year questions."
 * />
 */
export const SEO = ({
    title,
    description = "Community Learning Platform - Access study materials, notes, and connect with your college community.",
    image = "/favicon.ico",
    url = "https://studyspace.vercel.app"
}: SEOProps) => (
    <Helmet>
        <title>{title} | StudySpace</title>
        <meta name="description" content={description} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={`${title} | StudySpace`} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${title} | StudySpace`} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
    </Helmet>
);

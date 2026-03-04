import { SEO } from "@/components/SEO";
import { SpatialLanding } from "@/features/landing3d/SpatialLanding";
import { LANDING_FAQ } from "@/features/landing3d/content";

const SITE_URL = "https://studyshare.in";
const LOGO_URL = `${SITE_URL}/brand/logo-mark.png`;
const ANDROID_APK_PATH = "/downloads/studyshare-android.apk";
const ANDROID_APK_URL = `${SITE_URL}${ANDROID_APK_PATH}`;

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "StudyShare",
    url: SITE_URL,
    logo: LOGO_URL,
    description: "College learning community with shared study resources, chatrooms, notices, and AI tools.",
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "StudyShare",
    url: SITE_URL,
    description: "StudyShare is a campus-first learning network for notes, notices, chatrooms, and AI study help.",
    inLanguage: "en-IN",
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "StudyShare",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web, Android",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
    featureList: [
      "College-specific study resources",
      "Department notices and updates",
      "Student chatrooms and discussions",
      "AI-powered study assistance",
    ],
    description:
      "StudyShare helps students access curated notes, previous year questions, department notices, peer discussions, and AI study assistance.",
    url: SITE_URL,
    downloadUrl: ANDROID_APK_URL,
  },
  {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: "StudyShare",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Android",
    downloadUrl: ANDROID_APK_URL,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
    url: SITE_URL,
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: LANDING_FAQ.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  },
];

const Index = () => {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground font-ai selection:bg-primary/20 selection:text-primary">
      <SEO
        title="AI-Powered College Study Network"
        description="StudyShare is a college community platform for study resources, department notices, chatrooms, and AI-powered learning support."
        canonical="/"
        image="/brand/logo-mark.png"
        keywords={[
          "college study resources",
          "student chatrooms",
          "department notices",
          "AI study assistant",
          "previous year questions",
          "study notes platform",
        ]}
        structuredData={structuredData}
      />
      <SpatialLanding />
    </div>
  );
};

export default Index;

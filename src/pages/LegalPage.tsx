import { Link, useLocation } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { SUPPORT_EMAIL } from "@/lib/support";

type LegalSection = {
  heading: string;
  points: string[];
};

type LegalDoc = {
  title: string;
  description: string;
  updatedOn: string;
  canonicalPath: string;
  sections: LegalSection[];
};

const LEGAL_DOCS: Record<string, LegalDoc> = {
  "/privacy-policy": {
    title: "Privacy Policy",
    description:
      "How StudyShare collects, uses, stores, and protects student data across app and website.",
    updatedOn: "April 11, 2026",
    canonicalPath: "/privacy-policy",
    sections: [
      {
        heading: "Data We Collect",
        points: [
          "Account details like email, display name, profile photo, and college metadata.",
          "Learning activity, app diagnostics, and moderation-related event data.",
          "User-generated resources, chatroom content, comments, and profile data.",
        ],
      },
      {
        heading: "How We Use Data",
        points: [
          "To deliver campus-specific feeds, access control, and personalization.",
          "To improve product reliability, moderation, abuse prevention, and analytics.",
          "To process support and account recovery/deletion requests.",
        ],
      },
      {
        heading: "Data Sharing and Retention",
        points: [
          "We do not sell personal data.",
          "Data may be processed by trusted infrastructure and payment providers.",
          "Retention is limited to product operation, security, legal, and audit needs.",
        ],
      },
      {
        heading: "Your Rights",
        points: [
          "You can request correction, export, or deletion of account-linked data.",
          "Certain records may be retained when required by legal or security policy.",
          `For privacy requests, contact ${SUPPORT_EMAIL}.`,
        ],
      },
    ],
  },
  "/terms-of-use": {
    title: "Terms of Use",
    description:
      "Rules, responsibilities, acceptable use, and service terms for StudyShare users.",
    updatedOn: "April 11, 2026",
    canonicalPath: "/terms-of-use",
    sections: [
      {
        heading: "Eligibility and Account Responsibility",
        points: [
          "You are responsible for account safety and activity from your login.",
          "You must provide accurate institutional and profile information.",
        ],
      },
      {
        heading: "Acceptable Use",
        points: [
          "Do not upload illegal, abusive, hateful, or infringing content.",
          "Do not attempt unauthorized access, scraping, or platform abuse.",
          "Do not impersonate students, faculty, or official departments.",
        ],
      },
      {
        heading: "Paid Features and Availability",
        points: [
          "Premium and AI recharge access is controlled by active entitlement state.",
          "Features and pricing may evolve with product updates.",
          "Service is provided as available with reasonable operational safeguards.",
        ],
      },
      {
        heading: "Enforcement and Contact",
        points: [
          "We may remove content or restrict accounts for policy violations.",
          `For legal or compliance questions, contact ${SUPPORT_EMAIL}.`,
        ],
      },
    ],
  },
  "/community-guidelines": {
    title: "Community Guidelines",
    description:
      "Behavior and content standards for StudyShare rooms, notices, and collaboration.",
    updatedOn: "April 11, 2026",
    canonicalPath: "/community-guidelines",
    sections: [
      {
        heading: "Community Behavior",
        points: [
          "Be respectful and constructive in comments, rooms, and replies.",
          "No harassment, hate speech, threats, or explicit content.",
          "No spam, fraud, or manipulative behavior.",
        ],
      },
      {
        heading: "Content Integrity",
        points: [
          "Share authentic and accurately labeled study content.",
          "Do not publish misleading notices or impersonate officials.",
          "Respect copyright and do not upload prohibited material.",
        ],
      },
      {
        heading: "Enforcement",
        points: [
          "Violations may lead to content removal, feature limits, or suspension.",
          `Report abuse to ${SUPPORT_EMAIL}.`,
        ],
      },
    ],
  },
  "/account-deletion": {
    title: "Account and Data Deletion",
    description:
      "How account deletion works in StudyShare and what data may remain for compliance.",
    updatedOn: "April 11, 2026",
    canonicalPath: "/account-deletion",
    sections: [
      {
        heading: "Delete from App",
        points: [
          "Use Settings -> Delete Account and confirm the deletion prompt.",
          "Deletion signs you out and revokes active sessions.",
        ],
      },
      {
        heading: "Post-deletion Processing",
        points: [
          "Profile and user content are removed or anonymized as applicable.",
          "Limited records may remain when required for legal/security reasons.",
        ],
      },
      {
        heading: "Manual Request",
        points: [
          "If in-app deletion fails, email support with your registered email and college.",
          `Manual deletion support: ${SUPPORT_EMAIL}.`,
        ],
      },
    ],
  },
};

const NAV_ITEMS = [
  { path: "/privacy-policy", label: "Privacy" },
  { path: "/terms-of-use", label: "Terms" },
  { path: "/community-guidelines", label: "Guidelines" },
  { path: "/account-deletion", label: "Deletion" },
] as const;

const LegalPage = () => {
  const location = useLocation();
  const doc = LEGAL_DOCS[location.pathname] ?? LEGAL_DOCS["/privacy-policy"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900">
      <SEO
        title={`${doc.title} | StudyShare`}
        description={doc.description}
        canonical={`https://studyshare.in${doc.canonicalPath}`}
      />

      <div className="mx-auto w-full max-w-4xl px-4 py-10 md:px-8 md:py-14">
        <div className="mb-8 flex flex-wrap items-center gap-2">
          {NAV_ITEMS.map((item) => {
            const active = item.path === doc.canonicalPath;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={[
                  "rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide transition",
                  active
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <article className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm md:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
            {doc.title}
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Last updated: {doc.updatedOn}
          </p>
          <p className="mt-4 text-base leading-relaxed text-slate-700">
            {doc.description}
          </p>

          <div className="mt-8 space-y-7">
            {doc.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-lg font-semibold text-slate-900 md:text-xl">
                  {section.heading}
                </h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700 md:text-base">
                  {section.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900 md:text-base">
            Need help? Reach us at
            {" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-semibold underline decoration-blue-400 underline-offset-4"
            >
              {SUPPORT_EMAIL}
            </a>
            .
          </div>
        </article>
      </div>
    </div>
  );
};

export default LegalPage;

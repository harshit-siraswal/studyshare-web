import fs from "fs";
import path from "path";
import {
  ensureDir,
  escapeHtml,
  getSiteUrl,
  loadBlogPosts,
  projectRoot,
  toAbsoluteUrl,
} from "./seo-shared.mjs";

const BRAND_NAME = "StudyShare";

function upsertTag(html, pattern, replacement) {
  if (pattern.test(html)) {
    return html.replace(pattern, replacement);
  }
  return html.replace("</head>", `${replacement}\n</head>`);
}

function upsertMetaByName(html, name, content) {
  const tag = `<meta name="${name}" content="${escapeHtml(content)}" />`;
  const pattern = new RegExp(`<meta\\s+name=["']${name}["'][^>]*>`, "i");
  return upsertTag(html, pattern, tag);
}

function upsertMetaByProperty(html, property, content) {
  const tag = `<meta property="${property}" content="${escapeHtml(content)}" />`;
  const pattern = new RegExp(`<meta\\s+property=["']${property}["'][^>]*>`, "i");
  return upsertTag(html, pattern, tag);
}

function upsertCanonical(html, href) {
  const tag = `<link rel="canonical" href="${escapeHtml(href)}" />`;
  return upsertTag(html, /<link\s+rel=["']canonical["'][^>]*>/i, tag);
}

function upsertJsonLd(html, schemaValue) {
  const serialized = JSON.stringify(schemaValue);
  const tag = `<script type="application/ld+json">${serialized}</script>`;
  const pattern = /<script\s+type=["']application\/ld\+json["']>[\s\S]*?<\/script>/i;
  return upsertTag(html, pattern, tag);
}

function injectRootMarkup(html, rootMarkup) {
  return html.replace(
    /<div id="root">[\s\S]*?<\/div>/i,
    `<div id="root">${rootMarkup}</div>`,
  );
}

function getHomeFallbackMarkup() {
  return `
    <main aria-label="StudyShare homepage" style="min-height:100vh;background:linear-gradient(180deg,#050816 0%,#0b1022 100%);color:#f8fafc;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <section style="max-width:1120px;margin:0 auto;padding:72px 24px 56px;">
        <div style="display:inline-flex;align-items:center;gap:12px;padding:8px 14px;border:1px solid rgba(148,163,184,.22);border-radius:999px;background:rgba(37,99,235,.10);color:#93c5fd;font-size:14px;font-weight:600;letter-spacing:.02em;">
          AI study platform for college communities
        </div>
        <h1 style="margin:24px 0 16px;font-size:clamp(2.4rem,5vw,4.75rem);line-height:1.02;font-weight:800;letter-spacing:-0.04em;max-width:840px;">
          StudyShare helps students find notes, PYQs, notices, syllabi, and AI study help in one place.
        </h1>
        <p style="margin:0;max-width:760px;font-size:clamp(1rem,1.8vw,1.25rem);line-height:1.75;color:#cbd5e1;">
          Join your college, browse semester-wise resources, discover department notices, access previous year questions, and study faster with AI-powered learning tools built for campus workflows.
        </p>

        <div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:28px;">
          <a href="/select-college" style="display:inline-flex;align-items:center;justify-content:center;padding:14px 22px;border-radius:14px;background:#2563eb;color:#fff;text-decoration:none;font-weight:700;">Select Your College</a>
          <a href="/blog" style="display:inline-flex;align-items:center;justify-content:center;padding:14px 22px;border-radius:14px;border:1px solid rgba(148,163,184,.24);background:rgba(15,23,42,.72);color:#e2e8f0;text-decoration:none;font-weight:600;">Read Study Tips</a>
        </div>
      </section>

      <section style="max-width:1120px;margin:0 auto;padding:0 24px 72px;">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px;">
          <article style="padding:22px;border-radius:22px;border:1px solid rgba(148,163,184,.16);background:rgba(15,23,42,.78);box-shadow:0 20px 60px rgba(2,6,23,.28);">
            <h2 style="margin:0 0 10px;font-size:1.05rem;font-weight:700;color:#f8fafc;">Semester-wise resources</h2>
            <p style="margin:0;line-height:1.7;color:#cbd5e1;">Browse curated notes, labs, handouts, and subject material mapped to your branch and semester.</p>
          </article>
          <article style="padding:22px;border-radius:22px;border:1px solid rgba(148,163,184,.16);background:rgba(15,23,42,.78);box-shadow:0 20px 60px rgba(2,6,23,.28);">
            <h2 style="margin:0 0 10px;font-size:1.05rem;font-weight:700;color:#f8fafc;">PYQs, notices, and syllabi</h2>
            <p style="margin:0;line-height:1.7;color:#cbd5e1;">Keep exam prep and academic updates together with previous year questions, official notices, and syllabus documents.</p>
          </article>
          <article style="padding:22px;border-radius:22px;border:1px solid rgba(148,163,184,.16);background:rgba(15,23,42,.78);box-shadow:0 20px 60px rgba(2,6,23,.28);">
            <h2 style="margin:0 0 10px;font-size:1.05rem;font-weight:700;color:#f8fafc;">AI-powered study tools</h2>
            <p style="margin:0;line-height:1.7;color:#cbd5e1;">Use AI study features to organize material, ask questions, and move faster through revision without losing context.</p>
          </article>
        </div>
      </section>
    </main>
  `.trim();
}

function applySeo(baseHtml, meta) {
  const siteUrl = getSiteUrl();
  const canonical = toAbsoluteUrl(meta.canonicalPath, siteUrl);
  const image = toAbsoluteUrl(meta.imagePath || "/brand/logo-mark.png", siteUrl);
  const title = meta.title.includes(BRAND_NAME) ? meta.title : `${meta.title} | ${BRAND_NAME}`;
  const robots = meta.noIndex
    ? "noindex, nofollow, noarchive"
    : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";

  let html = baseHtml;
  html = upsertTag(html, /<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = upsertMetaByName(html, "description", meta.description);
  html = upsertMetaByName(html, "robots", robots);
  html = upsertMetaByName(html, "googlebot", robots);
  html = upsertCanonical(html, canonical);

  html = upsertMetaByProperty(html, "og:type", meta.type || "website");
  html = upsertMetaByProperty(html, "og:site_name", BRAND_NAME);
  html = upsertMetaByProperty(html, "og:url", canonical);
  html = upsertMetaByProperty(html, "og:title", title);
  html = upsertMetaByProperty(html, "og:description", meta.description);
  html = upsertMetaByProperty(html, "og:image", image);
  html = upsertMetaByProperty(html, "og:image:alt", `${BRAND_NAME} preview`);

  html = upsertMetaByName(html, "twitter:card", "summary_large_image");
  html = upsertMetaByName(html, "twitter:url", canonical);
  html = upsertMetaByName(html, "twitter:title", title);
  html = upsertMetaByName(html, "twitter:description", meta.description);
  html = upsertMetaByName(html, "twitter:image", image);

  if (meta.structuredData) {
    html = upsertJsonLd(html, meta.structuredData);
  }

  return html;
}

function writeRouteHtml(distDir, routePath, html) {
  const normalizedPath = routePath === "/" ? "" : routePath.replace(/^\/+/, "");
  const targetDir = path.join(distDir, normalizedPath);
  ensureDir(targetDir);
  fs.writeFileSync(path.join(targetDir, "index.html"), html, "utf8");
}

function main() {
  const distDir = path.join(projectRoot, "dist");
  const indexFile = path.join(distDir, "index.html");
  if (!fs.existsSync(indexFile)) {
    throw new Error("dist/index.html not found. Run build before prerender.");
  }

  const siteUrl = getSiteUrl();
  const posts = loadBlogPosts();
  const baseHtml = fs.readFileSync(indexFile, "utf8");

  const homeHtml = applySeo(baseHtml, {
    title: "StudyShare | AI Study Platform for College Notes, PYQs and Notices",
    description:
      "StudyShare is an AI-powered college learning platform for notes, PYQs, notices, syllabi, and campus communities. Join your college, find semester-wise resources, and study faster.",
    canonicalPath: "/",
    type: "website",
    structuredData: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          name: BRAND_NAME,
          alternateName: ["StudyShare AI"],
          url: `${siteUrl}/`,
          logo: `${siteUrl}/brand/logo-mark.png`,
          description:
            "AI-powered college learning platform with notes, PYQs, notices, syllabi, and peer communities.",
        },
        {
          "@type": "WebSite",
          name: BRAND_NAME,
          alternateName: ["StudyShare AI"],
          url: `${siteUrl}/`,
          description:
            "AI-powered college learning platform with notes, PYQs, notices, syllabi, and peer communities.",
        },
        {
          "@type": "SoftwareApplication",
          name: BRAND_NAME,
          applicationCategory: "EducationalApplication",
          operatingSystem: "Web, Android",
          url: `${siteUrl}/`,
          description:
            "StudyShare helps college students discover semester-wise resources, ask AI questions, and stay updated with notices.",
        },
      ],
    },
  });
  const homeHtmlWithBody = injectRootMarkup(homeHtml, getHomeFallbackMarkup());
  fs.writeFileSync(indexFile, homeHtmlWithBody, "utf8");

  const blogHtml = applySeo(baseHtml, {
    title: "Blog for College Study Tips and Exam Preparation",
    description:
      "Read practical guides on AI learning, exam revision, study routines, chatroom collaboration, and organizing notes semester-wise.",
    canonicalPath: "/blog",
    type: "website",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "StudyShare Blog",
      url: `${siteUrl}/blog`,
      description:
        "Study tips, exam prep strategies, and practical college productivity guides for students.",
      blogPost: posts.map((post) => ({
        "@type": "BlogPosting",
        headline: post.title,
        datePublished: post.publishedAt,
        url: `${siteUrl}/blog/${post.slug}`,
        description: post.description,
      })),
    },
  });
  writeRouteHtml(distDir, "/blog", blogHtml);

  posts.forEach((post) => {
    const postHtml = applySeo(baseHtml, {
      title: post.title,
      description: post.description,
      canonicalPath: `/blog/${post.slug}`,
      type: "article",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.description,
          datePublished: post.publishedAt,
          dateModified: post.publishedAt,
          mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
          url: `${siteUrl}/blog/${post.slug}`,
          publisher: {
            "@type": "Organization",
            name: BRAND_NAME,
            logo: {
              "@type": "ImageObject",
              url: `${siteUrl}/brand/logo-mark.png`,
            },
          },
          author: {
            "@type": "Organization",
            name: "StudyShare Team",
          },
          keywords: Array.isArray(post.keywords) ? post.keywords.join(", ") : "",
          articleSection: post.category,
          inLanguage: "en-IN",
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/blog` },
            {
              "@type": "ListItem",
              position: 3,
              name: post.title,
              item: `${siteUrl}/blog/${post.slug}`,
            },
          ],
        },
      ],
    });

    writeRouteHtml(distDir, `/blog/${post.slug}`, postHtml);
  });

  console.log(`[seo] Prerendered blog SEO pages (${posts.length + 1} routes).`);
}

main();

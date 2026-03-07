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
    <main aria-label="StudyShare homepage" style="min-height:100vh;background:radial-gradient(circle at top,#1d4ed80f 0%,transparent 38%),linear-gradient(180deg,#020617 0%,#0f172a 100%);color:#f8fafc;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:1120px;margin:0 auto;padding:32px 16px 72px;">
        <div style="display:flex;justify-content:flex-end;gap:10px;margin:0 0 32px;">
          <span style="display:inline-flex;align-items:center;padding:9px 14px;border-radius:999px;border:1px solid rgba(148,163,184,.18);background:rgba(15,23,42,.65);color:#cbd5e1;font-size:13px;">Theme</span>
          <span style="display:inline-flex;align-items:center;padding:9px 14px;border-radius:999px;background:#2563eb;color:#fff;font-size:13px;font-weight:600;">Download APK</span>
        </div>

        <header style="text-align:center;margin:0 0 52px;">
          <div style="display:inline-flex;align-items:center;gap:18px;margin:0 0 22px;padding:16px 20px;border-radius:28px;border:1px solid rgba(37,99,235,.16);background:rgba(15,23,42,.62);box-shadow:0 24px 60px rgba(15,23,42,.22);backdrop-filter:blur(20px);">
            <div style="display:flex;align-items:center;justify-content:center;width:96px;height:96px;border-radius:24px;background:linear-gradient(135deg,rgba(37,99,235,.18),rgba(59,130,246,.08));box-shadow:inset 0 0 0 1px rgba(37,99,235,.18);">
              <img src="/brand/logo-mark.png" alt="StudyShare" width="72" height="72" style="display:block;width:72px;height:72px;object-fit:contain;" />
            </div>
            <div style="text-align:left;">
              <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:.28em;text-transform:uppercase;color:rgba(96,165,250,.9);">AI Study Platform</p>
              <h1 style="margin:0;font-size:clamp(2.6rem,5vw,4.8rem);line-height:1;font-weight:800;letter-spacing:-.05em;color:#f8fafc;">StudyShare</h1>
            </div>
          </div>
          <p style="margin:0 auto;max-width:760px;font-size:clamp(1rem,1.8vw,1.22rem);line-height:1.75;color:#cbd5e1;">
            StudyShare helps students find notes, PYQs, notices, syllabi, and AI study help in one place. Join your college, browse semester-wise resources, and study faster with AI-powered learning tools built for campus workflows.
          </p>
        </header>

        <section style="max-width:832px;margin:0 auto 28px;">
          <div style="position:relative;padding:0 18px;height:56px;border-radius:18px;border:1px solid rgba(148,163,184,.18);background:rgba(15,23,42,.74);box-shadow:0 18px 40px rgba(2,6,23,.18);display:flex;align-items:center;color:#64748b;font-size:16px;">
            Search for your college or university...
          </div>
        </section>

        <section style="max-width:980px;margin:0 auto;">
          <p style="margin:0 0 18px;font-size:16px;font-weight:500;color:#94a3b8;">Select your institution</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;">
            <article style="padding:18px 20px;border-radius:20px;border:1px solid rgba(148,163,184,.14);background:rgba(15,23,42,.74);">
              <h2 style="margin:0 0 8px;font-size:16px;font-weight:700;color:#f8fafc;">Krishna Institute of Engineering and Technology</h2>
              <p style="margin:0;font-size:14px;color:#94a3b8;">Ghaziabad</p>
            </article>
            <article style="padding:18px 20px;border-radius:20px;border:1px solid rgba(148,163,184,.14);background:rgba(15,23,42,.74);">
              <h2 style="margin:0 0 8px;font-size:16px;font-weight:700;color:#f8fafc;">IIIT Bhagalpur</h2>
              <p style="margin:0;font-size:14px;color:#94a3b8;">Bhagalpur, Bihar</p>
            </article>
            <article style="padding:18px 20px;border-radius:20px;border:1px solid rgba(148,163,184,.14);background:rgba(15,23,42,.74);">
              <h2 style="margin:0 0 8px;font-size:16px;font-weight:700;color:#f8fafc;">IIIT Sonepat</h2>
              <p style="margin:0;font-size:14px;color:#94a3b8;">Sonepat, Haryana</p>
            </article>
            <article style="padding:18px 20px;border-radius:20px;border:1px solid rgba(148,163,184,.14);background:rgba(15,23,42,.74);">
              <h2 style="margin:0 0 8px;font-size:16px;font-weight:700;color:#f8fafc;">Delhi University</h2>
              <p style="margin:0;font-size:14px;color:#94a3b8;">New Delhi</p>
            </article>
          </div>
        </section>
      </div>
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
          url: `${siteUrl}/`,
          logo: `${siteUrl}/brand/logo-mark.png`,
          description:
            "AI-powered college learning platform with notes, PYQs, notices, syllabi, and peer communities.",
        },
        {
          "@type": "WebSite",
          name: BRAND_NAME,
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

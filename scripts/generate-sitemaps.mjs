import fs from "fs";
import path from "path";
import { ensureDir, escapeXml, getSiteUrl, loadBlogPosts, projectRoot } from "./seo-shared.mjs";

function buildUrlEntry({ loc, lastmod, changefreq, priority }) {
  return [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>` : "",
    changefreq ? `    <changefreq>${escapeXml(changefreq)}</changefreq>` : "",
    priority ? `    <priority>${escapeXml(priority)}</priority>` : "",
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

function writeXml(filePath, body) {
  fs.writeFileSync(filePath, `<?xml version="1.0" encoding="UTF-8"?>\n${body}\n`, "utf8");
}

function main() {
  const siteUrl = getSiteUrl();
  const posts = loadBlogPosts();
  const today = new Date().toISOString().slice(0, 10);

  const publicDir = path.join(projectRoot, "public");
  const sitemapsDir = path.join(publicDir, "sitemaps");
  ensureDir(sitemapsDir);

  const coreEntries = [
    buildUrlEntry({
      loc: `${siteUrl}/`,
      lastmod: today,
      changefreq: "weekly",
      priority: "1.0",
    }),
    buildUrlEntry({
      loc: `${siteUrl}/privacy-policy`,
      lastmod: today,
      changefreq: "yearly",
      priority: "0.5",
    }),
    buildUrlEntry({
      loc: `${siteUrl}/terms-of-use`,
      lastmod: today,
      changefreq: "yearly",
      priority: "0.5",
    }),
    buildUrlEntry({
      loc: `${siteUrl}/community-guidelines`,
      lastmod: today,
      changefreq: "yearly",
      priority: "0.4",
    }),
    buildUrlEntry({
      loc: `${siteUrl}/account-deletion`,
      lastmod: today,
      changefreq: "yearly",
      priority: "0.4",
    }),
  ];

  const blogEntries = [
    buildUrlEntry({
      loc: `${siteUrl}/blog`,
      lastmod: today,
      changefreq: "weekly",
      priority: "0.9",
    }),
    ...posts.map((post) =>
      buildUrlEntry({
        loc: `${siteUrl}/blog/${post.slug}`,
        lastmod: post.publishedAt || today,
        changefreq: "monthly",
        priority: "0.8",
      })
    ),
  ];

  writeXml(
    path.join(sitemapsDir, "core.xml"),
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${coreEntries.join("\n")}\n</urlset>`
  );

  writeXml(
    path.join(sitemapsDir, "blog.xml"),
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${blogEntries.join("\n")}\n</urlset>`
  );

  const indexXml = [
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    "  <sitemap>",
    `    <loc>${escapeXml(`${siteUrl}/sitemaps/core.xml`)}</loc>`,
    `    <lastmod>${today}</lastmod>`,
    "  </sitemap>",
    "  <sitemap>",
    `    <loc>${escapeXml(`${siteUrl}/sitemaps/blog.xml`)}</loc>`,
    `    <lastmod>${today}</lastmod>`,
    "  </sitemap>",
    "</sitemapindex>",
  ].join("\n");

  writeXml(path.join(publicDir, "sitemap.xml"), indexXml);
  // Legacy compatibility for older references
  writeXml(
    path.join(publicDir, "blogs.xml"),
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${blogEntries.join("\n")}\n</urlset>`
  );

  console.log(`[seo] Generated sitemap index and child sitemaps (${posts.length} blog posts).`);
}

main();


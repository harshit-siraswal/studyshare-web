import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SEO } from "@/components/SEO";
import { blogPosts, getBlogPostBySlug } from "@/content/blogPosts";

const BlogPost = () => {
  const { slug = "" } = useParams();
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return (
      <main className="min-h-screen bg-background text-foreground px-6 py-16">
        <SEO
          title="Blog Article Not Found"
          description="The requested blog article does not exist."
          noIndex
        />
        <div className="max-w-3xl mx-auto">
          <p className="text-sm font-semibold text-primary">StudyShare Blog</p>
          <h1 className="text-3xl font-bold mt-3">Article not found</h1>
          <p className="text-muted-foreground mt-3">
            This blog URL may be outdated or incorrect.
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 mt-6 text-primary font-semibold hover:text-primary/80"
          >
            <ArrowLeft className="h-4 w-4" /> Back to blog
          </Link>
        </div>
      </main>
    );
  }

  const relatedPosts = blogPosts.filter((item) => item.slug !== post.slug).slice(0, 2);
  const canonicalPath = `/blog/${post.slug}`;

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      datePublished: post.publishedAt,
      dateModified: post.publishedAt,
      mainEntityOfPage: `https://studyshare.in${canonicalPath}`,
      url: `https://studyshare.in${canonicalPath}`,
      publisher: {
        "@type": "Organization",
        name: "StudyShare",
        logo: {
          "@type": "ImageObject",
          url: "https://studyshare.in/brand/logo-mark.png",
        },
      },
      author: {
        "@type": "Organization",
        name: "StudyShare Team",
      },
      keywords: post.keywords.join(", "),
      articleSection: post.category,
      inLanguage: "en-IN",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://studyshare.in/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Blog",
          item: "https://studyshare.in/blog",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: post.title,
          item: `https://studyshare.in${canonicalPath}`,
        },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SEO
        title={post.title}
        description={post.description}
        canonical={canonicalPath}
        image="/brand/logo-mark.png"
        type="article"
        keywords={post.keywords}
        structuredData={structuredData}
      />

      <article className="px-6 md:px-12 py-12">
        <div className="max-w-3xl mx-auto">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
          >
            <ArrowLeft className="h-4 w-4" /> Back to blog
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.12em] text-primary">
            {post.category}
          </p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mt-3 leading-tight">
            {post.title}
          </h1>
          <p className="text-muted-foreground mt-4 text-lg">{post.description}</p>
          <p className="text-sm text-muted-foreground mt-4">
            {new Date(post.publishedAt).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            . {post.readTime}
          </p>

          <div className="space-y-8 mt-10">
            {post.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl font-semibold">{section.heading}</h2>
                <p className="text-muted-foreground leading-8 mt-3">{section.body}</p>
              </section>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-border bg-secondary/30 p-6">
            <h3 className="text-xl font-semibold">Want to apply this in your daily study flow?</h3>
            <p className="text-muted-foreground mt-2">
              Join StudyShare to access campus resources, department updates,
              peer discussions, and AI-powered revision in one place.
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 mt-5 text-sm font-semibold text-primary hover:text-primary/80"
            >
              Start with StudyShare <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </article>

      <section className="px-6 md:px-12 pb-14">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold">Related articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            {relatedPosts.map((related) => (
              <Link
                key={related.slug}
                to={`/blog/${related.slug}`}
                className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
                  {related.category}
                </p>
                <h3 className="text-lg font-semibold mt-2 leading-tight">{related.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{related.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default BlogPost;

import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SEO } from "@/components/SEO";
import { blogPosts } from "@/content/blogPosts";

const Blog = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "StudyShare Blog",
    url: "https://studyshare.in/blog",
    description:
      "Study tips, exam prep strategies, and practical college productivity guides for students.",
    blogPost: blogPosts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      datePublished: post.publishedAt,
      url: `https://studyshare.in/blog/${post.slug}`,
      description: post.description,
    })),
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SEO
        title="Blog for College Study Tips and Exam Preparation"
        description="Read practical guides on AI learning, exam revision, study routines, chatroom collaboration, and organizing notes semester-wise."
        canonical="/blog"
        image="/brand/logo-mark.png"
        keywords={[
          "college study tips blog",
          "exam preparation strategy",
          "student productivity guide",
          "ai learning for students",
          "study routine blog",
        ]}
        structuredData={structuredData}
      />

      <section className="px-6 md:px-12 py-16 border-b border-border/50 bg-secondary/20">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            StudyShare Blog
          </p>
          <h1 className="text-3xl md:text-5xl font-bold mt-3 tracking-tight">
            Study Smarter With Actionable Student Guides
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mt-5">
            In-depth guides on exam preparation, college productivity, AI learning,
            and community-led doubt solving. Every article is written for real
            campus workflows.
          </p>
        </div>
      </section>

      <section className="px-6 md:px-12 py-14">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <span className="font-medium text-primary">{post.category}</span>
                <span>{post.readTime}</span>
              </div>
              <h2 className="text-2xl font-semibold mt-3 leading-tight">{post.title}</h2>
              <p className="text-muted-foreground mt-3">{post.description}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {post.keywords.slice(0, 3).map((keyword) => (
                  <span
                    key={keyword}
                    className="text-xs rounded-full bg-secondary px-3 py-1 border border-border/60"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
              <div className="mt-6">
                <Link
                  to={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Read article <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Blog;

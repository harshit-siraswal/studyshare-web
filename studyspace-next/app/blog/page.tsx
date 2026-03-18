import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { blogPosts } from "@/content/blogPosts";

export const metadata: Metadata = {
  title: "Blog",
  description: "Insights, guides, and updates from the Studyspace team.",
};

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border/50 bg-secondary/20 px-6 py-16 md:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            StudyShare Blog
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
            Study Smarter With Actionable Student Guides
          </h1>
          <p className="mt-5 max-w-3xl text-lg text-muted-foreground">
            In-depth guides on exam preparation, college productivity, AI learning, and
            community-led doubt solving. Every article is written for real campus workflows.
          </p>
        </div>
      </section>

      <section className="px-6 py-14 md:px-12">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <span className="font-medium text-primary">{post.category}</span>
                <span>{post.readTime}</span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold leading-tight">{post.title}</h2>
              <p className="mt-3 text-muted-foreground">{post.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {post.keywords.slice(0, 3).map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full border border-border/60 bg-secondary px-3 py-1 text-xs"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
              <div className="mt-6">
                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
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
}

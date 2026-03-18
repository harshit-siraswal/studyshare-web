import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { blogPosts, getBlogPostBySlug } from "@/content/blogPosts";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((entry) => entry.slug === slug);

  if (!post) {
    return {};
  }

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = blogPosts.filter((item) => item.slug !== post.slug).slice(0, 2);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <article className="px-6 py-12 md:px-12">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
          >
            <ArrowLeft className="h-4 w-4" /> Back to blog
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.12em] text-primary">
            {post.category}
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{post.description}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            {new Date(post.publishedAt).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            . {post.readTime}
          </p>

          <div className="mt-10 space-y-8">
            {post.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl font-semibold">{section.heading}</h2>
                <p className="mt-3 leading-8 text-muted-foreground">{section.body}</p>
              </section>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-border bg-secondary/30 p-6">
            <h3 className="text-xl font-semibold">Want to apply this in your daily study flow?</h3>
            <p className="mt-2 text-muted-foreground">
              Join StudyShare to access campus resources, department updates, peer
              discussions, and AI-powered revision in one place.
            </p>
            <Link
              href="/auth"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
            >
              Start with StudyShare <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </article>

      <section className="px-6 pb-14 md:px-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold">Related articles</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {relatedPosts.map((related) => (
              <Link
                key={related.slug}
                href={`/blog/${related.slug}`}
                className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
                  {related.category}
                </p>
                <h3 className="mt-2 text-lg font-semibold leading-tight">{related.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{related.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

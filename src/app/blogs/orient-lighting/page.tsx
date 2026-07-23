import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getBlogPosts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Blog",
  description: "News and guides from Orient Lighting.",
};

export default async function BlogIndexPage() {
  const posts = await getBlogPosts();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-3xl text-brand-navy">Orient Lighting Blog</h1>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blogs/orient-lighting/${post.handle}`}
            className="overflow-hidden rounded-lg border border-brand-border bg-white transition hover:shadow-md"
          >
            <div className="relative aspect-[16/10] bg-slate-100">
              {post.image ? (
                <Image src={post.image} alt="" fill className="object-cover" sizes="33vw" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-brand-muted">
                  Orient Lighting
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="text-xs text-brand-muted">{post.publishedAt}</p>
              <h2 className="mt-1 font-display text-xl text-brand-navy">{post.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-brand-muted">{post.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

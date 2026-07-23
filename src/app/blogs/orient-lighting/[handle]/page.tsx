import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getBlogPost } from "@/lib/catalog";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const post = await getBlogPost(handle);
  if (!post) return { title: "Article" };
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({ params }: Props) {
  const { handle } = await params;
  const post = await getBlogPost(handle);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-xs text-brand-muted">{post.publishedAt}</p>
      <h1 className="mt-2 font-display text-4xl text-brand-navy">{post.title}</h1>
      {post.image ? (
        <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-lg">
          <Image src={post.image} alt="" fill className="object-cover" sizes="800px" />
        </div>
      ) : null}
      <div
        className="prose-product mt-8 text-base"
        dangerouslySetInnerHTML={{ __html: post.body }}
      />
    </article>
  );
}

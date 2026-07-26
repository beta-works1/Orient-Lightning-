import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage } from "@/lib/catalog";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const page = await getPage(handle);
  if (!page) return { title: "Page" };
  return { title: page.title };
}

export default async function StaticPage({ params }: Props) {
  const { handle } = await params;
  const page = await getPage(handle);
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl text-brand-navy sm:text-4xl">{page.title}</h1>
      <div
        className="prose-product mt-6 text-base"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.body) }}
      />
    </div>
  );
}

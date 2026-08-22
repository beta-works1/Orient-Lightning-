import type { CatalogueLink } from "@/lib/types";

export type { CatalogueLink };

type Variant = "hero" | "pdp" | "outline";

const styles: Record<Variant, string> = {
  hero: "rounded-md border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10",
  pdp: "inline-flex items-center gap-2 rounded-md border border-brand-border px-4 py-2 text-sm font-medium text-brand-navy transition hover:border-brand hover:text-brand",
  outline:
    "inline-flex items-center gap-2 rounded-md border border-brand px-5 py-2.5 text-sm font-semibold text-brand hover:bg-brand hover:text-white",
};

export function DownloadCatalogue({
  variant = "outline",
  catalogue,
}: {
  variant?: Variant;
  catalogue?: CatalogueLink | null;
}) {
  if (!catalogue?.url) return null;

  return (
    <a
      href={catalogue.url}
      download={catalogue.filename}
      target="_blank"
      rel="noopener noreferrer"
      title={catalogue.filename}
      className={styles[variant]}
    >
      {variant === "pdp" ? <DownloadIcon /> : null}
      Download Catalogue
    </a>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

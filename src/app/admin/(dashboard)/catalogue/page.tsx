import { CatalogueAdminForm } from "@/components/admin/CatalogueAdminForm";
import {
  DEFAULT_CATALOGUE,
  getCatalogueSettingFresh,
} from "@/lib/catalogueSettings";

export const dynamic = "force-dynamic";

export default async function AdminCataloguePage() {
  let current = DEFAULT_CATALOGUE;
  try {
    current = await getCatalogueSettingFresh();
  } catch {
    current = DEFAULT_CATALOGUE;
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-white drop-shadow">Catalogue</h1>
      <p className="mb-6 max-w-2xl text-sm text-white/85">
        Manage the PDF linked from the storefront “Download Catalogue” buttons (homepage, product
        pages, and related CTAs).
      </p>
      <CatalogueAdminForm current={current} />
    </div>
  );
}

import { CatalogueAdminForm } from "@/components/admin/CatalogueAdminForm";
import { getCatalogueSetting } from "@/lib/catalogueSettings";

export default async function AdminCataloguePage() {
  const current = await getCatalogueSetting();

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

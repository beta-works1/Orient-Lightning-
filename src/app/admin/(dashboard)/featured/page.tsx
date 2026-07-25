import { FeaturedAdminForm } from "@/components/admin/FeaturedAdminForm";
import { getAllProducts } from "@/lib/catalog";
import {
  DEFAULT_FEATURED,
  getFeaturedSettingFresh,
} from "@/lib/featuredSettings";

export const dynamic = "force-dynamic";

export default async function AdminFeaturedPage() {
  const [setting, products] = await Promise.all([
    getFeaturedSettingFresh().catch(() => DEFAULT_FEATURED),
    getAllProducts(),
  ]);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-white drop-shadow">Featured this week</h1>
      <p className="mb-6 max-w-2xl text-sm text-white/85">
        Choose which products appear in the homepage featured rail, and in what order.
      </p>
      <FeaturedAdminForm
        current={setting}
        products={products.map((p) => ({
          handle: p.handle,
          title: p.title,
          price: p.price,
          image: p.images[0] || null,
        }))}
      />
    </div>
  );
}

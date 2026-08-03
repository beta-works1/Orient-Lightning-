import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductById } from "@/lib/catalog";
import { ProductForm } from "@/components/admin/ProductForm";
import { wattagePricesFromVariants, wattageSizesFromVariants } from "@/lib/adminProductOptions";
import { ADMIN_PRODUCT_COLLECTIONS } from "@/lib/types";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

function optionValues(
  options: { name: string; values: string[] }[] | undefined,
  match: RegExp,
) {
  const hit = options?.find((o) => match.test(o.name));
  return hit?.values || [];
}

export default async function EditProductPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const product = await getProductById(id);
  if (!product) notFound();

  const wattFromOptions = optionValues(product.options, /watt/i).map((v) =>
    v.replace(/\s*watt$/i, "").trim(),
  );
  const tempFromOptions = optionValues(product.options, /color|temp|cct/i).map((v) =>
    v.replace(/k$/i, "").trim(),
  );
  const styleFromOptions = optionValues(product.options, /style|shape|reflector/i);

  const wattTokens = product.facets?.wattage?.length
    ? product.facets.wattage
    : wattFromOptions;
  const wattage = wattTokens.join(", ");
  const colorTemp = (product.facets?.colorTemp?.length
    ? product.facets.colorTemp
    : tempFromOptions
  ).join(", ");

  const wattagePrices = wattagePricesFromVariants(product.variants, wattTokens);
  const wattageSizes = wattageSizesFromVariants(product.variants, wattTokens);

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/admin/products"
          className="rounded-md bg-white/90 px-2 py-1 text-sm text-slate-600 shadow-sm hover:text-slate-900"
        >
          ← Products
        </Link>
      </div>
      <h1 className="mb-2 text-2xl font-bold text-white drop-shadow">Edit product</h1>
      {sp.saved ? (
        <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Saved.
        </p>
      ) : null}
      <ProductForm
        mode="edit"
        productId={product.id}
        collections={[...ADMIN_PRODUCT_COLLECTIONS]}
        initial={{
          title: product.title,
          handle: product.handle,
          description: product.description,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          productType: product.productType || "",
          status: (product.status as "draft" | "published") || "published",
          wattage,
          colorTemp,
          options: styleFromOptions.join(", "),
          images: product.images,
          collectionHandles: product.collectionIds,
          wattagePrices,
          wattageSizes,
        }}
      />
    </div>
  );
}

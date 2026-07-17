import { WHATSAPP_NUMBER } from "./types";

export function formatPrice(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function whatsappProductUrl(productTitle: string, handle?: string): string {
  const text = encodeURIComponent(
    `Hi Orient Lighting, I'm interested in ordering: ${productTitle}${
      handle ? ` (https://orientlighting.com.pk/products/${handle})` : ""
    }`,
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

export function whatsappGeneralUrl(message?: string): string {
  const text = encodeURIComponent(
    message || "Hi Orient Lighting, I have a query about your LED products.",
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

/**
 * Bypass Vercel Image Optimization entirely.
 * Hobby/unpaid plans return 402 OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED
 * for `/_next/image`, which shows as broken product thumbnails.
 */
export default function imageLoader({ src }: { src: string }) {
  return src;
}

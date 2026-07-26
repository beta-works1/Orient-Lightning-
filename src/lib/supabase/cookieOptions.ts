/** Shared cookie flags for admin auth sessions (@supabase/ssr). */
export const authCookieOptions = {
  path: "/",
  sameSite: "lax" as const,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

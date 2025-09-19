export { default } from "next-auth/middleware";

export const config = {
  // Protect these routes
  matcher: [
    "/properties/:path*",
    "/api/properties/:path*",
  ],
};

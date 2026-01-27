import { type NextRequest, NextResponse } from "next/server";

// TODO: Backend integration - Authentication will be handled by wallet connection
// Future implementation should use wallet signatures (MetaMask, WalletConnect, etc.)
// For now, all routes are accessible without authentication

export async function middleware(request: NextRequest) {
  // Remove all authentication checks
  // All routes are now publicly accessible
  // This allows development and testing without backend

  // TODO: Implement wallet-based authentication
  // - Check for wallet signature in cookies/headers
  // - Verify signature validity
  // - Optionally protect certain routes (admin, settings, etc.)

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

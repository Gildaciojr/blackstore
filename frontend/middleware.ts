import { NextRequest, NextResponse } from "next/server";

function isProtectedPath(pathname: string) {
  return (
    pathname.startsWith("/account") ||
    pathname.startsWith("/checkout")
  );
}

export function middleware(req: NextRequest) {

  const { pathname } = req.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get("bs_token")?.value;

  /**
   * Se não tiver token → redireciona login
   */
  if (!token) {

    const loginUrl = new URL("/login", req.url);

    loginUrl.searchParams.set(
      "redirect",
      pathname
    );

    return NextResponse.redirect(loginUrl);

  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account/:path*",
    "/checkout/:path*",
  ],
};
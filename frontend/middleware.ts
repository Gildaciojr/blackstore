import { NextRequest, NextResponse } from "next/server";

function isProtectedPath(pathname: string) {
  return (
    pathname.startsWith("/account") ||
    pathname.startsWith("/checkout")
  );
}

export function middleware(req: NextRequest) {

  const { pathname, search } = req.nextUrl;

  /**
   * liberar rotas públicas
   */
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get("bs_token")?.value;

  /**
   * se não tiver token → redireciona login
   */
  if (!token) {

    const loginUrl = new URL("/login", req.url);

    /**
     * manter rota original + query
     */
    loginUrl.searchParams.set(
      "redirect",
      `${pathname}${search || ""}`
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
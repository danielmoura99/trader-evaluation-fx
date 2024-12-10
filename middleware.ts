import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  async function middleware(request) {
    const isAuth = !!request.nextauth.token;
    const isAuthPage = request.nextUrl.pathname.startsWith("/auth");
    const isRootPage = request.nextUrl.pathname === "/";

    // Se estiver na página de autenticação mas já estiver logado
    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Se estiver na raiz
    if (isRootPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // Se não estiver autenticado e tentar acessar uma rota protegida
    if (!isAuth && !isAuthPage) {
      return NextResponse.redirect(new URL(`/auth/login`, request.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // e
      authorized() {
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

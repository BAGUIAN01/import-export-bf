// middleware.js
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { canAccess, roleHome, ROLES_PERSONNEL } from "@/lib/rbac"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    if (path.startsWith("/admin")) {
      const role = token?.role
      // Personnel seulement ; chaque profil n'ouvre que ses modules (lib/rbac.js)
      if (!role || !ROLES_PERSONNEL.includes(role)) {
        return NextResponse.redirect(new URL("/", req.url))
      }
      if (!canAccess(role, path)) {
        const accueil = roleHome[role] || "/admin"
        return NextResponse.redirect(new URL(accueil === path ? "/" : accueil, req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname

        if (path.startsWith("/admin")) {
          return !!token
        }

        return true
      },
    },
    pages: {
      signIn: "/auth/signin",
    },
  }
)

export const config = {
  matcher: [
    "/admin/:path*",
  ],
}
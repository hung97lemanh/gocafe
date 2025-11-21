import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Protect all /admin/* routes.
 * If not authenticated redirect to /api/auth/signin with callbackUrl.
 */
export async function middleware(req: NextRequest) {
    const { pathname, origin } = req.nextUrl;

    // Only protect /admin and anything under it
    if (pathname.startsWith("/admin")) {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

        if (!token) {
            const signInUrl = new URL("/api/auth/signin", origin);
            signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
            return NextResponse.redirect(signInUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*"]
};

import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const { pathname } = request.nextUrl;

    // Protect /app routes - require authentication
    if (pathname.startsWith("/app")) {
        if (!token) {
            const url = new URL("/login", request.url);
            url.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(url);
        }
    }

    // Redirect authenticated users away from login/signup
    if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
        if (token) {
            return NextResponse.redirect(new URL("/app/dashboard", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/app/:path*", "/login", "/signup"],
};

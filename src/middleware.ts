import { getToken } from "@auth/core/jwt";
import { NextResponse } from "next/server";

const locales = ["ru", "de", "en"];
const defaultLocale = "de";

function getLocale(request) {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && locales.includes(cookieLocale)) return cookieLocale;
  const acceptLang = request.headers.get("Accept-Language");
  if (acceptLang) {
    const preferred = acceptLang.split(",")[0]?.split("-")[0];
    if (preferred && locales.includes(preferred)) return preferred;
  }
  return defaultLocale;
}

export default async function middleware(req) {
  const { pathname } = req.nextUrl;
  const publicPaths = ["/login", "/register", "/activate", "/api/auth", "/api/health"];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  if (!isPublic) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, secureCookie: true });
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
  }

  const locale = getLocale(req);
  const response = NextResponse.next();
  if (!req.cookies.has("NEXT_LOCALE") || req.cookies.get("NEXT_LOCALE").value !== locale) {
    response.cookies.set("NEXT_LOCALE", locale, { path: "/", maxAge: 31536000, sameSite: "lax" });
  }
  return response;
}

export const config = { matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"] };
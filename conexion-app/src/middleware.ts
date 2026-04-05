import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // If env vars are missing, allow through to show a helpful error page
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    // No env vars — let the request through so Next.js can show its own error
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Public routes
    if (
      pathname.startsWith("/login") ||
      pathname.startsWith("/consent") ||
      pathname.startsWith("/privacy") ||
      pathname.startsWith("/api")
    ) {
      if (user && pathname === "/login") {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
      return supabaseResponse
    }

    // Protected routes — redirect to login if not authenticated
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    return supabaseResponse
  } catch {
    // If Supabase fails for any reason, redirect to login gracefully
    if (!pathname.startsWith("/login")) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|icons|manifest\\.json|sw\\.js).*)",
  ],
}


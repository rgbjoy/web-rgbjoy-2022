import { NextResponse, type NextRequest } from "next/server"

/** Pass the path to the root layout so link previews can describe the page being shared. */
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers)
  headers.set("x-pathname", request.nextUrl.pathname)
  return NextResponse.next({ request: { headers } })
}

export const config = { matcher: ["/experiments/:path*", "/studio"] }

import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Next.js internals 直接放行
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  const password = process.env.ACCESS_PASSWORD ?? '0103'

  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Basic ')) {
    const decoded = atob(authHeader.slice(6))
    const inputPassword = decoded.split(':').slice(1).join(':')
    if (inputPassword === password) {
      return NextResponse.next()
    }
  }

  // 未認證 → 顯示瀏覽器內建的密碼輸入視窗
  return new NextResponse('需要密碼才能存取', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Sorbet Recipe Engine", charset="UTF-8"',
    },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

import { resolveAccess } from '@lantai-dua/shared/access';
import { type NextRequest, NextResponse } from 'next/server';
import { createProxySupabase } from './lib/supabase/proxy-client';
import { getViewer } from './lib/viewer';

/** Menyegarkan sesi Supabase dan mengarahkan pengguna sesuai perannya (PRD §6.3). */
export async function proxy(request: NextRequest) {
  const { supabase, response } = createProxySupabase(request);
  const { viewer } = await getViewer(supabase);
  const decision = resolveAccess(request.nextUrl.pathname, viewer, request.nextUrl.search);

  if (decision.kind === 'allow') return response();

  const redirect = NextResponse.redirect(new URL(decision.to, request.url));
  for (const cookie of response().cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

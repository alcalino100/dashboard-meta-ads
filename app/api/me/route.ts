import { NextResponse } from "next/server"
import { isSupabaseConfigured } from "@/lib/supabase/admin"
import { getRequester } from "@/lib/admin-guard"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ role: null }, { status: 200 })
  const requester = await getRequester(req)
  if (!requester) return NextResponse.json({ role: null }, { status: 200 })
  return NextResponse.json({
    role: requester.role,
    email: requester.email,
    appUserId: requester.appUserId,
  })
}

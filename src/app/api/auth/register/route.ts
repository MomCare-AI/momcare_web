import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { name, email } = await req.json()

  if (!name || !email) {
    return NextResponse.json({ detail: "Name and email are required" }, { status: 400 })
  }

  return NextResponse.json({
    token: "mock-jwt-token-doctor",
    user: { id: "99", name, email, role: "doctor" },
  })
}

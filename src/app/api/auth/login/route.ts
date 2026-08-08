import { NextRequest, NextResponse } from "next/server"

const MOCK_USERS = [
  { email: "doctor@momcare.com", password: "test123", id: "1", name: "Dr. Ayesha", role: "doctor" },
  { email: "ngo@momcare.com",    password: "test123", id: "2", name: "Fatima NGO",  role: "ngo"    },
  { email: "admin@momcare.com",  password: "test123", id: "3", name: "Super Admin", role: "admin"  },
]

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  const user = MOCK_USERS.find((u) => u.email === email && u.password === password)

  if (!user) {
    return NextResponse.json({ detail: "Invalid email or password" }, { status: 401 })
  }

  const { password: _, ...safeUser } = user

  return NextResponse.json({
    token: `mock-jwt-token-${safeUser.role}`,
    user: safeUser,
  })
}

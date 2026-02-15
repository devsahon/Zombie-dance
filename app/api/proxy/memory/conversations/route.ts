import { NextResponse } from "next/server"

export async function GET() {
  const uasApiUrl = process.env.UAS_API_URL
  const uasApiKey = process.env.UAS_API_KEY

  if (!uasApiUrl) {
    return NextResponse.json({ error: "UAS_API_URL not configured" }, { status: 503 })
  }

  try {
    const response = await fetch(`${uasApiUrl}/memory/conversations`, {
      headers: {
        ...(uasApiKey && { Authorization: `Bearer ${uasApiKey}` }),
      },
      cache: "no-store",
    })

    if (!response.ok) {
      return NextResponse.json([], { status: 200 })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Conversations fetch error:", error)
    return NextResponse.json([], { status: 200 })
  }
}

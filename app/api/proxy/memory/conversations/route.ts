import { NextResponse } from "next/server"

export async function GET() {
  const uasApiUrl = process.env.UAS_API_URL || "http://localhost:8000"
  const uasApiKey = process.env.UAS_API_KEY

  if (!uasApiUrl) {
    return NextResponse.json({ error: "UAS_API_URL not configured" }, { status: 503 })
  }

  try {
    const response = await fetch(`${uasApiUrl}/memory/conversations`, {
      headers: {
        "Content-Type": "application/json",
        ...(uasApiKey && { Authorization: `Bearer ${uasApiKey}` }),
      },
      cache: "no-store",
    })

    if (!response.ok) {
      console.error("[v0] Conversations API error:", response.status, response.statusText)
      // Return fallback data for development
      return NextResponse.json([
        {
          id: "conv-1",
          name: "Code Generation Session",
          messageCount: 5,
          lastUpdated: new Date().toISOString()
        },
        {
          id: "conv-2",
          name: "Debugging Session",
          messageCount: 3,
          lastUpdated: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: "conv-3",
          name: "Architecture Discussion",
          messageCount: 7,
          lastUpdated: new Date(Date.now() - 7200000).toISOString()
        }
      ])
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Conversations fetch error:", error)
    // Return fallback data
    return NextResponse.json([
      {
        id: "conv-1",
        name: "Code Generation Session",
        messageCount: 5,
        lastUpdated: new Date().toISOString()
      }
    ])
  }
}

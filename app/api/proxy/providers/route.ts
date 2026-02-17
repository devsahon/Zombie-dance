import { type NextRequest, NextResponse } from "next/server"

const UAS_API_URL = process.env.UAS_API_URL || "http://localhost:8000"

export async function GET() {
  try {
    const response = await fetch(`${UAS_API_URL}/providers`, {
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.UAS_API_KEY || "",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      console.error("[v0] Providers API error:", response.status, response.statusText)
      // Return fallback data for development
      return NextResponse.json({
        providers: [
          {
            id: 1,
            name: "Ollama Local",
            endpoint: "http://localhost:11434",
            status: "active",
            fallbackConfig: {
              enabled: false,
              fallbackTo: null
            },
            cacheSettings: {
              enabled: true,
              ttl: 300
            },
            costTracking: {
              totalCost: 0,
              requestCount: 0
            },
            createdAt: new Date().toISOString()
          },
          {
            id: 2,
            name: "OpenAI API",
            endpoint: "https://api.openai.com/v1",
            status: "inactive",
            fallbackConfig: {
              enabled: true,
              fallbackTo: "Ollama Local"
            },
            cacheSettings: {
              enabled: true,
              ttl: 600
            },
            costTracking: {
              totalCost: 0,
              requestCount: 0
            },
            createdAt: new Date().toISOString()
          }
        ]
      })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Providers API error:", error)
    // Return fallback data
    return NextResponse.json({
      providers: [
        {
          id: 1,
          name: "Ollama Local",
          endpoint: "http://localhost:11434",
          status: "active",
          fallbackConfig: {
            enabled: false,
            fallbackTo: null
          },
          cacheSettings: {
            enabled: true,
            ttl: 300
          },
          costTracking: {
            totalCost: 0,
            requestCount: 0
          },
          createdAt: new Date().toISOString()
        }
      ]
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${UAS_API_URL}/providers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.UAS_API_KEY || "",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to add provider" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Providers API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

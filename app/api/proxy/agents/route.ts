import { NextResponse } from "next/server"

export async function GET() {
  const uasApiUrl = process.env.UAS_API_URL || "http://localhost:8000"
  const uasApiKey = process.env.UAS_API_KEY

  if (!uasApiUrl) {
    return NextResponse.json({ error: "UAS_API_URL not configured" }, { status: 503 })
  }

  try {
    const response = await fetch(`${uasApiUrl}/agents`, {
      headers: {
        "Content-Type": "application/json",
        ...(uasApiKey && { Authorization: `Bearer ${uasApiKey}` }),
      },
      cache: "no-store",
    })

    if (!response.ok) {
      console.error("[v0] Agents API error:", response.status, response.statusText)
      // Return fallback data for development
      return NextResponse.json({
        success: true,
        agents: [
          {
            id: 1,
            name: "Code Editor Agent",
            status: "active",
            type: "editor",
            endpoint: "localhost:8000",
            capabilities: ["code_generation", "file_editing"],
            metrics: {
              requestCount: 0,
              avgResponseTime: 0,
              errorRate: 0
            }
          },
          {
            id: 2,
            name: "Master Orchestrator",
            status: "active",
            type: "master",
            endpoint: "localhost:8000",
            capabilities: ["orchestration", "task_management"],
            metrics: {
              requestCount: 0,
              avgResponseTime: 0,
              errorRate: 0
            }
          },
          {
            id: 3,
            name: "Chat Assistant",
            status: "active",
            type: "chatbot",
            endpoint: "localhost:8000",
            capabilities: ["chat", "conversation"],
            metrics: {
              requestCount: 0,
              avgResponseTime: 0,
              errorRate: 0
            }
          }
        ]
      })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Agents fetch error:", error)
    // Return fallback data
    return NextResponse.json({
      success: true,
      agents: [
        {
          id: 1,
          name: "Code Editor Agent",
          status: "active",
          type: "editor",
          endpoint: "localhost:8000",
          capabilities: ["code_generation", "file_editing"]
        },
        {
          id: 2,
          name: "Master Orchestrator",
          status: "active",
          type: "master",
          endpoint: "localhost:8000",
          capabilities: ["orchestration", "task_management"]
        },
        {
          id: 3,
          name: "Chat Assistant",
          status: "active",
          type: "chatbot",
          endpoint: "localhost:8000",
          capabilities: ["chat", "conversation"]
        }
      ]
    })
  }
}

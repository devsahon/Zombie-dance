import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const uasApiUrl = process.env.UAS_API_URL || "http://localhost:8000";
  const uasApiKey = process.env.UAS_API_KEY;

  if (!uasApiUrl) {
    return NextResponse.json({ error: "UAS_API_URL not configured" }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const apiUrl = queryString ? `${uasApiUrl}/servers?${queryString}` : `${uasApiUrl}/servers`;

    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...(uasApiKey && { "X-API-Key": uasApiKey }),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[v0] Servers API error:", response.status, response.statusText);
      // Return fallback data for development
      return NextResponse.json([
        {
          id: 1,
          name: "Main Server",
          hostname: "localhost",
          ip_address: "127.0.0.1",
          location: "Local",
          status: "online",
          cpu_load: 25.5,
          memory_usage: 60.2,
          disk_usage: 45.8,
          uptime_seconds: 86400,
          last_heartbeat: new Date().toISOString(),
          provider_id: 1,
          provider_name: "Ollama Local",
          provider_type: "local",
          metadata: {
            version: "1.0.0",
            region: "local"
          }
        },
        {
          id: 2,
          name: "Backup Server",
          hostname: "backup-server",
          ip_address: "192.168.1.100",
          location: "Network",
          status: "offline",
          cpu_load: 0,
          memory_usage: 0,
          disk_usage: 30.1,
          uptime_seconds: 0,
          last_heartbeat: new Date(Date.now() - 3600000).toISOString(),
          provider_id: null,
          provider_name: null,
          provider_type: null,
          metadata: {
            version: "1.0.0",
            region: "backup"
          }
        }
      ]);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[v0] Servers fetch error:", error);
    // Return fallback data
    return NextResponse.json([
      {
        id: 1,
        name: "Main Server",
        hostname: "localhost",
        ip_address: "127.0.0.1",
        location: "Local",
        status: "online",
        cpu_load: 25.5,
        memory_usage: 60.2,
        disk_usage: 45.8,
        uptime_seconds: 86400,
        last_heartbeat: new Date().toISOString(),
        provider_id: 1,
        provider_name: "Ollama Local",
        provider_type: "local",
        metadata: {
          version: "1.0.0",
          region: "local"
        }
      }
    ]);
  }
}

export async function POST(request: Request) {
  const uasApiUrl = process.env.UAS_API_URL || "http://localhost:8000";
  const uasApiKey = process.env.UAS_API_KEY;

  if (!uasApiUrl) {
    return NextResponse.json({ error: "UAS_API_URL not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();

    const response = await fetch(`${uasApiUrl}/servers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(uasApiKey && { "X-API-Key": uasApiKey }),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Failed to create server", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[v0] Server creation error:", error);
    return NextResponse.json({ error: "Connection failed" }, { status: 503 });
  }
}
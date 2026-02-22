import { NextResponse } from "next/server";

export async function GET() {
  const uasApiUrl = process.env.UAS_API_URL;
  const uasApiKey = process.env.UAS_API_KEY;

  if (!uasApiUrl) {
    return NextResponse.json({ error: "UAS_API_URL not configured" }, { status: 503 });
  }

  try {
    // First try to get models from our backend API (which will try database first, then Ollama)
    const response = await fetch(`${uasApiUrl}/models`, {
      headers: {
        ...(uasApiKey && { "X-API-Key": uasApiKey }),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      // If our backend fails, try to get directly from Ollama
      try {
        const ollamaResponse = await fetch(`${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api/tags`);
        if (ollamaResponse.ok) {
          const ollamaData = await ollamaResponse.json();
          return NextResponse.json({
            success: true,
            data: ollamaData.models || [],
            count: ollamaData.models?.length || 0,
            source: 'ollama_direct',
            timestamp: new Date().toISOString()
          });
        }
      } catch (ollamaError) {
        console.error("Direct Ollama fetch failed:", ollamaError);
      }

      return NextResponse.json({ error: "Failed to fetch models" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[v0] Models fetch error:", error);
    return NextResponse.json({ error: "Connection failed" }, { status: 503 });
  }
}
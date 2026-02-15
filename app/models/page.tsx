"use client"

import { useEffect, useState } from "react"
import { Server, Loader2, Play, Square, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Model {
  id: string
  name: string
  version: string
  status: "running" | "stopped" | "error" | "pending" | "loading"
  cpu?: number
  memory?: number
  port?: number
  provider_name?: string
  provider_type?: string
  requests_handled?: number
  last_response_time?: number
  total_tokens_used?: number
  created_at?: string
  updated_at?: string
  size?: number
  modified?: string
  digest?: string
  details?: {
    format: string
    family: string
    parameterSize: string
    quantizationLevel: string
  }
}

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchModels = async () => {
    try {
      const response = await fetch("/api/proxy/models")
      if (response.ok) {
        const data = await response.json()
        // Handle both database and Ollama API responses
        if (data.success && Array.isArray(data.data)) {
          setModels(data.data.map((model: any) => ({
            id: model.id || model.name,
            name: model.model_name || model.name || model.model,
            version: model.model_version || model.details?.parameterSize || 'N/A',
            status: model.status || 'stopped',
            cpu: model.cpu_usage || undefined,
            memory: model.memory_usage || undefined,
            requests_handled: model.requests_handled || undefined,
            total_tokens_used: model.total_tokens_used || undefined,
            provider_name: model.provider_name,
            provider_type: model.provider_type,
            created_at: model.created_at,
            updated_at: model.updated_at,
            size: model.size,
            modified: model.modified,
            details: model.details
          })))
        } else if (Array.isArray(data)) {
          // Handle legacy array response
          setModels(data.map((model: any) => ({
            id: model.id || model.name,
            name: model.model_name || model.name || model.model,
            version: model.model_version || model.details?.parameterSize || 'N/A',
            status: model.status || 'stopped',
            cpu: model.cpu_usage || undefined,
            memory: model.memory_usage || undefined,
            requests_handled: model.requests_handled || undefined,
            total_tokens_used: model.total_tokens_used || undefined,
            provider_name: model.provider_name,
            provider_type: model.provider_type,
            created_at: model.created_at,
            updated_at: model.updated_at,
            size: model.size,
            modified: model.modified,
            details: model.details
          })))
        } else {
          setModels([])
        }
      } else {
        setModels([])
      }
    } catch (error) {
      console.log("[v0] Failed to fetch models:", error)
      setModels([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchModels()
    const interval = setInterval(fetchModels, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchModels()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "text-success"
      case "stopped":
        return "text-muted-foreground"
      case "error":
        return "text-destructive"
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
    switch (status) {
      case "running":
        return `${baseClasses} bg-success/10 text-success`
      case "stopped":
        return `${baseClasses} bg-muted text-muted-foreground`
      case "error":
        return `${baseClasses} bg-destructive/10 text-destructive`
      default:
        return `${baseClasses} bg-muted text-muted-foreground`
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Models</h1>
          <p className="mt-2 text-sm text-muted-foreground">Manage and monitor your local model instances</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-lg border border-border bg-card p-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading models...</span>
          </div>
        </div>
      ) : models.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Server className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No models found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Make sure your UAS backend is running and models are configured
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {models.map((model) => (
            <div key={model.id} className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2">
                    <Server className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{model.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {model.provider_name ? `${model.provider_name} (${model.provider_type})` : model.version}
                    </p>
                  </div>
                </div>
                <span className={getStatusBadge(model.status)}>{model.status}</span>
              </div>

              {(model.status === "running" || model.cpu !== undefined) && (
                <div className="mt-4 space-y-2">
                  {model.cpu !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">CPU</span>
                      <span className="font-medium">{model.cpu.toFixed(1)}%</span>
                    </div>
                  )}
                  {model.memory !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Memory</span>
                      <span className="font-medium">{model.memory.toFixed(1)}%</span>
                    </div>
                  )}
                  {model.requests_handled !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Requests</span>
                      <span className="font-medium">{model.requests_handled}</span>
                    </div>
                  )}
                  {model.total_tokens_used !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tokens</span>
                      <span className="font-mono text-xs">{model.total_tokens_used}</span>
                    </div>
                  )}
                  {model.size !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Size</span>
                      <span className="font-mono text-xs">{(model.size / (1024*1024*1024)).toFixed(1)} GB</span>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                {model.status === "running" ? (
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    <Square className="mr-2 h-3 w-3" />
                    Stop
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    <Play className="mr-2 h-3 w-3" />
                    Start
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

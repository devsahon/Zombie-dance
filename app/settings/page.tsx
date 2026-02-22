"use client"

import { useState, useEffect } from "react"
import { SettingsIcon, Eye, EyeOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EnvVariable {
  key: string
  value: string
  isSecret: boolean
}

interface DefaultModelResponse {
  success?: boolean
  defaultModel?: string | null
}

export default function SettingsPage() {
  const [envVars, setEnvVars] = useState<EnvVariable[]>([])
  const [showSecrets, setShowSecrets] = useState(false)
  const [loading, setLoading] = useState(true)

  const [models, setModels] = useState<string[]>([])
  const [defaultModel, setDefaultModel] = useState<string>("")
  const [savingDefaultModel, setSavingDefaultModel] = useState(false)

  useEffect(() => {
    fetchEnvVars()
    fetchModelsAndDefaultModel()
  }, [])

  const fetchEnvVars = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/proxy/settings/env")
      if (response.ok) {
        const data = await response.json()
        setEnvVars(data)
      }
    } catch (error) {
      console.log("[v0] Failed to fetch env vars:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchModelsAndDefaultModel = async () => {
    try {
      const [modelsRes, defaultRes] = await Promise.all([
        fetch("/api/proxy/models"),
        fetch("/api/proxy/settings/default-model"),
      ])

      if (modelsRes.ok) {
        const data = await modelsRes.json()
        const list = Array.isArray(data?.data) ? data.data : []
        const names = list
          .map((m: any) => String(m?.model_name || m?.name || "").trim())
          .filter((s: string) => Boolean(s))
        setModels(Array.from(new Set(names)))
      }

      if (defaultRes.ok) {
        const d = (await defaultRes.json()) as DefaultModelResponse
        setDefaultModel(typeof d?.defaultModel === "string" ? d.defaultModel : "")
      }
    } catch (error) {
      console.log("[v0] Failed to fetch models/default model:", error)
    }
  }

  const handleSaveDefaultModel = async () => {
    if (!defaultModel.trim()) return
    setSavingDefaultModel(true)
    try {
      const res = await fetch("/api/proxy/settings/default-model", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: defaultModel }),
      })

      if (res.ok) {
        await fetchModelsAndDefaultModel()
      }
    } catch (error) {
      console.log("[v0] Failed to save default model:", error)
    } finally {
      setSavingDefaultModel(false)
    }
  }

  const maskValue = (value: string) => {
    if (value.length <= 4) return "****"
    return value.substring(0, 4) + "*".repeat(value.length - 4)
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Settings</h1>
          <p className="mt-2 text-sm text-muted-foreground">Configure admin panel settings</p>
        </div>
        <Button onClick={fetchEnvVars} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-6 rounded-lg border border-border bg-card p-6">
            <div className="mb-4">
              <h3 className="font-medium">Default Model</h3>
              <p className="mt-1 text-sm text-muted-foreground">Used when an agent does not specify a model.</p>
            </div>

            <div className="grid gap-3">
              <Label>Model</Label>
              <Select value={defaultModel} onValueChange={setDefaultModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {models.length === 0 ? (
                    <SelectItem value="__no_models__" disabled>
                      No models
                    </SelectItem>
                  ) : (
                    models.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              <div className="flex justify-end">
                <Button onClick={handleSaveDefaultModel} disabled={!defaultModel.trim() || savingDefaultModel}>
                  {savingDefaultModel ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Environment Variables</h3>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowSecrets(!showSecrets)}>
                {showSecrets ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Show
                  </>
                )}
              </Button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-muted-foreground">Loading...</div>
            ) : envVars.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No environment variables configured</p>
              </div>
            ) : (
              <div className="space-y-4">
                {envVars.map((envVar) => (
                  <div key={envVar.key} className="space-y-2">
                    <Label>{envVar.key}</Label>
                    <Input
                      value={envVar.isSecret && !showSecrets ? maskValue(envVar.value) : envVar.value}
                      readOnly
                      className="font-mono text-sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="mb-4 font-medium">System Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span className="font-medium">0.1.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Environment</span>
                <span className="font-medium">Development</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Node Version</span>
                <span className="font-mono text-xs">v18+</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="mb-2 font-medium">Documentation</h3>
            <p className="text-sm text-muted-foreground">
              For detailed configuration instructions, see the documentation files in the repository.
            </p>
            <div className="mt-4 space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" asChild>
                <a href="/README.md" target="_blank" rel="noreferrer">
                  README.md
                </a>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" asChild>
                <a href="/CONFIGURATION.md" target="_blank" rel="noreferrer">
                  CONFIGURATION.md
                </a>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" asChild>
                <a href="/API.md" target="_blank" rel="noreferrer">
                  API.md
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

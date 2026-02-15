"use client"

import { useState, useEffect } from "react"
import { SettingsIcon, Eye, EyeOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface EnvVariable {
  key: string
  value: string
  isSecret: boolean
}

export default function SettingsPage() {
  const [envVars, setEnvVars] = useState<EnvVariable[]>([])
  const [showSecrets, setShowSecrets] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEnvVars()
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

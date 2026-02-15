"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, TestTube, AlertCircle, CheckCircle, Clock } from "lucide-react"
import { toast } from "sonner"

interface Provider {
  id: number
  name: string
  endpoint: string
  status: "active" | "inactive" | "degraded"
  fallbackConfig: {
    enabled: boolean
    fallbackTo?: string
  }
  cacheSettings: {
    enabled: boolean
    ttl: number
  }
  costTracking: {
    totalCost: number
    requestCount: number
  }
  createdAt: string
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null)
  const [testingProvider, setTestingProvider] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    endpoint: "",
    apiKey: "",
    fallbackEnabled: false,
    fallbackTo: "",
    cacheEnabled: true,
    cacheTtl: 3600,
  })

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      const response = await fetch("/api/proxy/providers")
      const data = await response.json()
      setProviders(data.providers || [])
    } catch (error) {
      console.error("[v0] Failed to fetch providers:", error)
      toast.error("Failed to load providers")
    }
  }

  const handleAddProvider = async () => {
    try {
      const response = await fetch("/api/proxy/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          endpoint: formData.endpoint,
          apiKey: formData.apiKey,
          fallbackConfig: {
            enabled: formData.fallbackEnabled,
            fallbackTo: formData.fallbackTo || undefined,
          },
          cacheSettings: {
            enabled: formData.cacheEnabled,
            ttl: formData.cacheTtl,
          },
        }),
      })

      if (response.ok) {
        toast.success("Provider added successfully")
        setIsAddDialogOpen(false)
        resetForm()
        fetchProviders()
      }
    } catch (error) {
      console.error("[v0] Failed to add provider:", error)
      toast.error("Failed to add provider")
    }
  }

  const handleEditProvider = async () => {
    if (!editingProvider) return

    try {
      const response = await fetch(`/api/proxy/providers/${editingProvider.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: formData.endpoint,
          fallbackConfig: {
            enabled: formData.fallbackEnabled,
            fallbackTo: formData.fallbackTo || undefined,
          },
          cacheSettings: {
            enabled: formData.cacheEnabled,
            ttl: formData.cacheTtl,
          },
        }),
      })

      if (response.ok) {
        toast.success("Provider updated successfully")
        setIsEditDialogOpen(false)
        setEditingProvider(null)
        resetForm()
        fetchProviders()
      }
    } catch (error) {
      console.error("[v0] Failed to update provider:", error)
      toast.error("Failed to update provider")
    }
  }

  const handleDeleteProvider = async (id: number) => {
    if (!confirm("Are you sure you want to delete this provider?")) return

    try {
      const response = await fetch(`/api/proxy/providers/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Provider deleted successfully")
        fetchProviders()
      }
    } catch (error) {
      console.error("[v0] Failed to delete provider:", error)
      toast.error("Failed to delete provider")
    }
  }

  const handleTestProvider = async (id: number) => {
    setTestingProvider(id)
    try {
      const response = await fetch(`/api/proxy/providers/${id}/test`, {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Provider is healthy (${data.responseTime}ms)`)
      } else {
        toast.error("Provider test failed")
      }
    } catch (error) {
      console.error("[v0] Failed to test provider:", error)
      toast.error("Failed to test provider")
    } finally {
      setTestingProvider(null)
    }
  }

  const handleToggleStatus = async (provider: Provider) => {
    const newStatus = provider.status === "active" ? "inactive" : "active"

    try {
      const response = await fetch(`/api/proxy/providers/${provider.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast.success(`Provider ${newStatus === "active" ? "enabled" : "disabled"}`)
        fetchProviders()
      }
    } catch (error) {
      console.error("[v0] Failed to toggle provider status:", error)
      toast.error("Failed to update provider status")
    }
  }

  const openEditDialog = (provider: Provider) => {
    setEditingProvider(provider)
    setFormData({
      name: provider.name,
      endpoint: provider.endpoint,
      apiKey: "",
      fallbackEnabled: provider.fallbackConfig.enabled,
      fallbackTo: provider.fallbackConfig.fallbackTo || "",
      cacheEnabled: provider.cacheSettings.enabled,
      cacheTtl: provider.cacheSettings.ttl,
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      endpoint: "",
      apiKey: "",
      fallbackEnabled: false,
      fallbackTo: "",
      cacheEnabled: true,
      cacheTtl: 3600,
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "degraded":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "inactive":
        return <Clock className="h-4 w-4 text-muted-foreground" />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cloud Providers</h1>
          <p className="text-muted-foreground">Manage AI service providers and configurations</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Provider
        </Button>
      </div>

      <div className="grid gap-4">
        {providers.map((provider) => (
          <Card key={provider.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-4 flex items-center gap-3">
                  <h3 className="text-xl font-semibold">{provider.name}</h3>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(provider.status)}
                    <span className="text-sm capitalize text-muted-foreground">{provider.status}</span>
                  </div>
                </div>

                <div className="grid gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Endpoint:</span>
                    <code className="rounded bg-muted px-2 py-1">{provider.endpoint}</code>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Cost:</span>
                      <span className="font-medium">${provider.costTracking.totalCost.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Requests:</span>
                      <span className="font-medium">{provider.costTracking.requestCount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Cache:</span>
                      <span className={provider.cacheSettings.enabled ? "text-green-500" : "text-muted-foreground"}>
                        {provider.cacheSettings.enabled ? "Enabled" : "Disabled"}
                      </span>
                      {provider.cacheSettings.enabled && (
                        <span className="text-muted-foreground">({provider.cacheSettings.ttl}s TTL)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Fallback:</span>
                      <span className={provider.fallbackConfig.enabled ? "text-green-500" : "text-muted-foreground"}>
                        {provider.fallbackConfig.enabled ? "Enabled" : "Disabled"}
                      </span>
                      {provider.fallbackConfig.fallbackTo && (
                        <span className="text-muted-foreground">→ {provider.fallbackConfig.fallbackTo}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTestProvider(provider.id)}
                  disabled={testingProvider === provider.id}
                >
                  <TestTube className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleToggleStatus(provider)}>
                  {provider.status === "active" ? "Disable" : "Enable"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEditDialog(provider)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDeleteProvider(provider.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {providers.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No providers configured</p>
          </Card>
        )}
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Cloud Provider</DialogTitle>
            <DialogDescription>Configure a new AI service provider</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Provider Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="OpenAI"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endpoint">API Endpoint</Label>
              <Input
                id="endpoint"
                value={formData.endpoint}
                onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="sk-..."
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="mb-3 font-medium">Cache Settings</h4>
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cacheEnabled">Enable Caching</Label>
                  <Switch
                    id="cacheEnabled"
                    checked={formData.cacheEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, cacheEnabled: checked })}
                  />
                </div>
                {formData.cacheEnabled && (
                  <div className="grid gap-2">
                    <Label htmlFor="cacheTtl">Cache TTL (seconds)</Label>
                    <Input
                      id="cacheTtl"
                      type="number"
                      value={formData.cacheTtl}
                      onChange={(e) => setFormData({ ...formData, cacheTtl: Number.parseInt(e.target.value) })}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="mb-3 font-medium">Fallback Configuration</h4>
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="fallbackEnabled">Enable Fallback</Label>
                  <Switch
                    id="fallbackEnabled"
                    checked={formData.fallbackEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, fallbackEnabled: checked })}
                  />
                </div>
                {formData.fallbackEnabled && (
                  <div className="grid gap-2">
                    <Label htmlFor="fallbackTo">Fallback Provider</Label>
                    <Input
                      id="fallbackTo"
                      value={formData.fallbackTo}
                      onChange={(e) => setFormData({ ...formData, fallbackTo: e.target.value })}
                      placeholder="anthropic"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddProvider}>Add Provider</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Cloud Provider</DialogTitle>
            <DialogDescription>Update provider configuration</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-endpoint">API Endpoint</Label>
              <Input
                id="edit-endpoint"
                value={formData.endpoint}
                onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="mb-3 font-medium">Cache Settings</h4>
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-cacheEnabled">Enable Caching</Label>
                  <Switch
                    id="edit-cacheEnabled"
                    checked={formData.cacheEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, cacheEnabled: checked })}
                  />
                </div>
                {formData.cacheEnabled && (
                  <div className="grid gap-2">
                    <Label htmlFor="edit-cacheTtl">Cache TTL (seconds)</Label>
                    <Input
                      id="edit-cacheTtl"
                      type="number"
                      value={formData.cacheTtl}
                      onChange={(e) => setFormData({ ...formData, cacheTtl: Number.parseInt(e.target.value) })}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="mb-3 font-medium">Fallback Configuration</h4>
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-fallbackEnabled">Enable Fallback</Label>
                  <Switch
                    id="edit-fallbackEnabled"
                    checked={formData.fallbackEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, fallbackEnabled: checked })}
                  />
                </div>
                {formData.fallbackEnabled && (
                  <div className="grid gap-2">
                    <Label htmlFor="edit-fallbackTo">Fallback Provider</Label>
                    <Input
                      id="edit-fallbackTo"
                      value={formData.fallbackTo}
                      onChange={(e) => setFormData({ ...formData, fallbackTo: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditProvider}>Update Provider</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

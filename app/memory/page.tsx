"use client"

import { useEffect, useState } from "react"
import { Database, Loader2, Trash2, Download, RefreshCw, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  role: "user" | "assistant" | "system"
  content: string
  timestamp?: string
}

interface Conversation {
  id: string
  name: string
  messageCount: number
  lastUpdated: string
}

export default function MemoryPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation)
    }
  }, [selectedConversation])

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/proxy/memory/conversations")
      if (response.ok) {
        const data = await response.json()
        setConversations(Array.isArray(data) ? data : [])
        if (data.length > 0 && !selectedConversation) {
          setSelectedConversation(data[0].id)
        }
      }
    } catch (error) {
      console.log("[v0] Failed to fetch conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    setLoadingMessages(true)
    try {
      const response = await fetch(`/api/proxy/memory/${conversationId}?limit=100`)
      if (response.ok) {
        const data = await response.json()
        setMessages(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.log("[v0] Failed to fetch messages:", error)
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleClearConversation = async () => {
    if (!selectedConversation) return

    try {
      const response = await fetch(`/api/proxy/memory/${selectedConversation}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setMessages([])
        fetchConversations()
      }
    } catch (error) {
      console.log("[v0] Failed to clear conversation:", error)
    }
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(messages, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `conversation-${selectedConversation}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return ""
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Memory</h1>
          <p className="mt-2 text-sm text-muted-foreground">View and manage conversation memory</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fetchConversations()} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-lg border border-border bg-card p-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading conversations...</span>
          </div>
        </div>
      ) : conversations.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Database className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No conversations found</h3>
          <p className="mt-2 text-sm text-muted-foreground">Start a conversation to see memory history</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 font-medium">Conversations</h3>
              <Select value={selectedConversation} onValueChange={setSelectedConversation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select conversation" />
                </SelectTrigger>
                <SelectContent>
                  {conversations.map((conv) => (
                    <SelectItem key={conv.id} value={conv.id}>
                      {conv.name || conv.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedConversation && (
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-3 font-medium">Actions</h3>
                <div className="space-y-2">
                  <Button onClick={handleExport} variant="outline" size="sm" className="w-full bg-transparent">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Button
                    onClick={handleClearConversation}
                    variant="outline"
                    size="sm"
                    className="w-full text-destructive hover:text-destructive bg-transparent"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-lg border border-border bg-card">
              <div className="border-b border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">
                      {conversations.find((c) => c.id === selectedConversation)?.name || "Conversation"}
                    </h3>
                  </div>
                  <span className="text-sm text-muted-foreground">{messages.length} messages</span>
                </div>
              </div>

              <ScrollArea className="h-[600px]">
                {loadingMessages ? (
                  <div className="flex items-center justify-center p-12">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading messages...</span>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-muted-foreground">No messages in this conversation</p>
                  </div>
                ) : (
                  <div className="space-y-4 p-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`rounded-lg p-4 ${
                          message.role === "user"
                            ? "bg-primary/10 ml-8"
                            : message.role === "assistant"
                              ? "bg-secondary mr-8"
                              : "bg-muted"
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">{message.role}</span>
                          {message.timestamp && (
                            <span className="text-xs text-muted-foreground">{formatTimestamp(message.timestamp)}</span>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

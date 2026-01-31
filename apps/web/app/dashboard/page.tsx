"use client"
import React from "react"
import AgentInterface from "@/components/agent/AgentInterface"
import { AppSidebar } from "@/components/app-sidebar"
import NotesInterface from "@/components/notes/NotesInterface"
import { SelectedNoteProvider } from "@/components/notes/selected-note-context"
import BreadcrumbNote from "@/components/notes/BreadcrumbNote"
import { CommandPalette } from "@/components/CommandPalette"
import { Separator } from "@/components/ui/separator"
import { Command, GripVertical, GripHorizontal, Pencil, Key, Eye, EyeOff, X, Search } from "lucide-react"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { UserButton } from "@clerk/nextjs"

const getApiKey = (): string => {
  if (typeof window === "undefined") return ""
  const stored = localStorage.getItem("gemini_api_key")
  if (stored) return stored
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
}

export default function Page() {
  const [mounted, setMounted] = React.useState(false)
  const [sidebarOpen, setSidebarOpen] = React.useState<boolean>(true)
  const [agentWidth, setAgentWidth] = React.useState<number>(25)
  const [notepadHeight, setNotepadHeight] = React.useState<number>(50)
  const [isResizing, setIsResizing] = React.useState(false)
  const [isResizingMobile, setIsResizingMobile] = React.useState(false)
  const [isDesktop, setIsDesktop] = React.useState(false)

  const [hasApiKey, setHasApiKey] = React.useState<boolean>(false)
  const [apiKey, setApiKey] = React.useState<string>("")
  const [showApiKey, setShowApiKey] = React.useState<boolean>(false)
  const [showApiKeyInput, setShowApiKeyInput] = React.useState<boolean>(false)
  const [actualApiKey, setActualApiKey] = React.useState<string>("")
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState<boolean>(false)

  React.useEffect(() => {
    const checkApiKey = () => {
      const key = getApiKey()
      setHasApiKey(!!key)
      if (key) {
        setActualApiKey(key)
        const masked = key.substring(0, 4) + "•".repeat(Math.max(0, key.length - 8)) + key.substring(key.length - 4)
        setApiKey(masked)
      } else {
        setApiKey("")
        setActualApiKey("")
      }
    }
    checkApiKey()
  }, [])

  const handleApiKeyChange = (value: string) => {
    setActualApiKey(value)
    if (value.trim()) {
      localStorage.setItem("gemini_api_key", value.trim())
      setHasApiKey(true)
      if (!showApiKey) {
        const masked = value.substring(0, 4) + "•".repeat(Math.max(0, value.length - 8)) + value.substring(value.length - 4)
        setApiKey(masked)
      } else {
        setApiKey(value)
      }
    } else {
      localStorage.removeItem("gemini_api_key")
      setHasApiKey(false)
      setApiKey("")
    }
  }

  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey)
    if (!showApiKey) {
      setApiKey(actualApiKey)
    } else {
      if (actualApiKey) {
        const masked = actualApiKey.substring(0, 4) + "•".repeat(Math.max(0, actualApiKey.length - 8)) + actualApiKey.substring(actualApiKey.length - 4)
        setApiKey(masked)
      }
    }
  }

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("appSidebarCollapsed")
      setSidebarOpen(raw != null ? raw !== "true" : true)

      const savedWidth = localStorage.getItem("agentPanelWidth")
      if (savedWidth) {
        setAgentWidth(parseFloat(savedWidth))
      }

      const savedMobileHeight = localStorage.getItem("notepadMobileHeight")
      if (savedMobileHeight) {
        setNotepadHeight(parseFloat(savedMobileHeight))
      }
    } catch { }
    setMounted(true)

    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768)
    }
    checkDesktop()
    window.addEventListener("resize", checkDesktop)
    return () => window.removeEventListener("resize", checkDesktop)
  }, [])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(prev => !prev)
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [commandPaletteOpen])

  const handleAiQuery = (query: string) => {
    window.dispatchEvent(new CustomEvent("nimble:ai-query", { detail: { prompt: query } }))
  }

  const handleSidebarOpenChange = (open: boolean) => {
    setSidebarOpen(open)
    try { localStorage.setItem("appSidebarCollapsed", String(!open)) } catch { }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  const handleMobileMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizingMobile(true)
  }

  React.useEffect(() => {
    if (isResizing) {
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    } else if (isResizingMobile) {
      document.body.style.cursor = 'row-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (typeof window === "undefined") return
      const container = document.querySelector('[data-slot="sidebar-inset"]') as HTMLElement
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const containerWidth = containerRect.width
      const padding = 32
      const gap = 16
      const availableWidth = containerWidth - padding * 2 - gap

      const mouseX = e.clientX - containerRect.left - padding
      const newAgentWidthPercent = ((availableWidth - mouseX) / availableWidth) * 100

      const minWidth = 20
      const maxWidth = 60
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newAgentWidthPercent))

      setAgentWidth(clampedWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  React.useEffect(() => {
    if (!isResizingMobile) return

    const handleMove = (clientY: number) => {
      if (typeof window === "undefined") return
      const container = document.querySelector('[data-slot="sidebar-inset"]') as HTMLElement
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const containerHeight = containerRect.height
      const headerHeight = 56
      const padding = 16
      const gap = 16
      const availableHeight = containerHeight - headerHeight - padding * 2 - gap

      const mouseY = clientY - containerRect.top - headerHeight - padding
      const newNotepadHeightPercent = (mouseY / availableHeight) * 100

      const minHeight = 25
      const maxHeight = 75
      const clampedHeight = Math.max(minHeight, Math.min(maxHeight, newNotepadHeightPercent))

      setNotepadHeight(clampedHeight)
    }

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientY)
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientY)
      }
    }

    const handleEnd = () => {
      setIsResizingMobile(false)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleEnd)
    window.addEventListener("touchmove", handleTouchMove, { passive: false })
    window.addEventListener("touchend", handleEnd)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleEnd)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleEnd)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizingMobile])

  React.useEffect(() => {
    if (!isResizing && agentWidth) {
      try {
        localStorage.setItem("agentPanelWidth", String(agentWidth))
      } catch { }
    }
  }, [isResizing, agentWidth])

  React.useEffect(() => {
    if (!isResizingMobile && notepadHeight) {
      try {
        localStorage.setItem("notepadMobileHeight", String(notepadHeight))
      } catch { }
    }
  }, [isResizingMobile, notepadHeight])

  if (!mounted) return null

  const notepadWidth = 100 - agentWidth

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={handleSidebarOpenChange}>
      <SelectedNoteProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col h-screen overflow-hidden">
          <header className="flex h-14 md:h-16 shrink-0 items-center gap-1.5 md:gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 dark:bg-[#282c34] dark:border-b dark:border-[#4a5568]">
            <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-4">
              <SidebarTrigger className="-ml-1 dark:text-[#9cdcfe] dark:hover:text-[#4fc3f7]" />
              <Separator
                orientation="vertical"
                className="mr-1 md:mr-2 data-[orientation=vertical]:h-4 dark:bg-[#4a5568]"
              />
              <BreadcrumbNote />
            </div>
            <div className="hidden md:flex items-center gap-3 ml-auto px-4">
              <button
                onClick={() => setCommandPaletteOpen(true)}
                className="inline-flex items-center justify-between rounded-md border border-border/40 dark:border-[#4a5568]/60 bg-background/50 dark:bg-[#2c313c]/50 hover:bg-muted/30 dark:hover:bg-[#3e4451]/50 hover:border-border/60 dark:hover:border-[#4a5568] transition-all px-3 py-1.5 w-[150px] h-8 group"
                title="Open command palette (Ctrl+K or Cmd+K)"
              >
                <div className="flex items-center gap-3 shrink-0">
                  <Search className="h-3 w-3 text-muted-foreground/60 dark:text-[#9cdcfe]/70 group-hover:text-muted-foreground dark:group-hover:text-[#4fc3f7] transition-colors" />
                  <span className="text-[11px] font-medium text-muted-foreground/70 dark:text-[#9cdcfe]/70 group-hover:text-muted-foreground dark:group-hover:text-[#4fc3f7] transition-colors whitespace-nowrap">Search</span>
                </div>
                <kbd className="inline-flex items-center justify-center gap-0.5 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground/50 dark:text-[#828997]/70 border border-border/30 dark:border-[#4a5568]/40 rounded bg-muted/20 dark:bg-[#3e4451]/30 shrink-0 h-[18px]">
                  <span className="text-[8px] leading-none inline-flex items-center justify-center h-full">⌘</span>
                  <span className="leading-none inline-flex items-center">K</span>
                </kbd>
              </button>
              <div className="inline-flex items-center gap-1.5 rounded-md border border-border/60 dark:border-[#4a5568] bg-secondary/50 dark:bg-[#3e4451] backdrop-blur-sm px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground dark:text-[#4fc3f7]">
                <Command className="h-3.5 w-3.5 dark:text-[#4fc3f7]" />
                <span>AI Agent</span>
              </div>

              {/* API Key Management - Creative Design */}
              {!showApiKeyInput ? (
                <button
                  type="button"
                  onClick={() => setShowApiKeyInput(true)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border/60 dark:border-[#4a5568] bg-secondary/30 dark:bg-[#3e4451]/50 hover:bg-secondary/50 dark:hover:bg-[#4a5568] hover:border-border dark:hover:border-[#4fc3f7]/50 transition-all active:scale-95 group px-2 py-1.5"
                  title={hasApiKey ? "Edit API Key" : "Set API Key"}
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground/70 dark:text-[#9cdcfe] group-hover:text-foreground dark:group-hover:text-[#4fc3f7] transition-colors" />
                  <span className="text-[11px] font-medium text-muted-foreground dark:text-[#9cdcfe] group-hover:text-foreground dark:group-hover:text-[#4fc3f7] transition-colors">API Key</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 dark:text-[#828997] z-10">
                      <Key className="h-3.5 w-3.5" />
                    </div>
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => handleApiKeyChange(e.target.value)}
                      placeholder="Enter Gemini API key"
                      autoFocus
                      className="pl-9 pr-20 py-1.5 rounded-md border border-border/60 dark:border-[#4a5568] bg-input dark:bg-[#3e4451] text-[11px] placeholder:text-muted-foreground/60 dark:placeholder:text-[#828997] dark:text-[#d4d4d4] focus:outline-none focus:ring-2 focus:ring-primary/30 dark:focus:ring-[#4fc3f7]/40 focus:border-primary/50 dark:focus:border-[#4fc3f7] transition-all w-[200px]"
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={toggleShowApiKey}
                        className="text-muted-foreground/60 dark:text-[#828997] hover:text-foreground dark:hover:text-[#4fc3f7] transition-colors p-0.5 rounded hover:bg-muted/30 dark:hover:bg-[#4a5568]/30"
                        title={showApiKey ? "Hide key" : "Show key"}
                      >
                        {showApiKey ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowApiKeyInput(false)
                          if (showApiKey && actualApiKey) {
                            const masked = actualApiKey.substring(0, 4) + "•".repeat(Math.max(0, actualApiKey.length - 8)) + actualApiKey.substring(actualApiKey.length - 4)
                            setApiKey(masked)
                            setShowApiKey(false)
                          }
                        }}
                        className="text-muted-foreground/60 dark:text-[#828997] hover:text-foreground dark:hover:text-red-500 transition-colors p-0.5 rounded hover:bg-muted/30 dark:hover:bg-[#4a5568]/30"
                        title="Close"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8 rounded-lg",
                    userButtonPopoverCard: "dark:bg-[#282c34] dark:border dark:border-[#4a5568] shadow-lg",
                    userButtonPopoverActionButton: "dark:text-[#9cdcfe] dark:hover:text-[#4fc3f7] dark:hover:bg-[#3e4451]",
                    userButtonPopoverActionButtonText: "dark:text-[#9cdcfe]",
                  }
                }}
              />
            </div>
          </header>
          <div className="flex flex-1 flex-col md:flex-row p-2 md:p-4 pt-0 md:min-h-0 md:overflow-hidden overflow-hidden">
            {/* <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
          </div> */}
            <div
              className="bg-muted/50 dark:bg-[#282c34] rounded-xl md:min-h-0 md:flex md:flex-col md:overflow-hidden flex flex-col overflow-hidden"
              style={{
                flex: isDesktop ? `0 0 ${notepadWidth}%` : `0 0 ${notepadHeight}%`,
                height: isDesktop ? 'auto' : `${notepadHeight}%`
              }}
            >
              <NotesInterface />
            </div>
            <div
              className={`md:hidden flex items-center justify-center h-1 cursor-row-resize transition-colors group relative z-10 ${isResizingMobile ? 'bg-border' : 'hover:bg-border/50'}`}
              onMouseDown={handleMobileMouseDown}
              onTouchStart={handleMobileMouseDown as any}
            >
              <div className={`flex items-center gap-1 transition-opacity ${isResizingMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <GripHorizontal className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div
              className={`hidden md:flex items-center justify-center w-1 cursor-col-resize transition-colors group relative z-10 ${isResizing ? 'bg-border' : 'hover:bg-border/50'}`}
              onMouseDown={handleMouseDown}
            >
              <div className={`flex flex-col gap-1 transition-opacity ${isResizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div
              className="bg-muted/50 dark:bg-[#282c34] rounded-xl w-full md:min-h-0 md:flex md:flex-col md:overflow-hidden md:max-h-full flex flex-col overflow-hidden"
              style={{
                flex: isDesktop ? `0 0 ${agentWidth}%` : `0 0 ${100 - notepadHeight}%`,
                height: isDesktop ? 'auto' : `${100 - notepadHeight}%`
              }}
            >
              <AgentInterface apiKey={actualApiKey} hasApiKey={hasApiKey} onApiKeyChange={handleApiKeyChange} />
            </div>
          </div>
        </SidebarInset>
        <CommandPalette
          open={commandPaletteOpen}
          onOpenChange={setCommandPaletteOpen}
          onAiQuery={handleAiQuery}
        />
      </SelectedNoteProvider>
    </SidebarProvider>
  )
}

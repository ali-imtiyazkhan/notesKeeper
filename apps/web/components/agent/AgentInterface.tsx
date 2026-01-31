"use client"

import * as React from "react"
import { Play, Loader2, Clipboard, Check, Sparkles, Wand2, ListTodo, NotebookPen, Trash2, Zap, Command, Bot, Eye, EyeOff, Key, Pencil, X, Sunrise, Lightbulb, Target, BookOpen, Coffee, TrendingUp, Brain, Rocket, Search, BarChart3, Link2, FileText, GitBranch, Sparkles as SparklesIcon, BookOpen as BookOpenIcon, RefreshCw, CheckSquare, KeyRound, ShieldCheck, ExternalLink } from "lucide-react"
import { useSelectedNote } from "@/components/notes/selected-note-context"
import { getNotes, getFolders } from "@/services/localstorage"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

type RunStatus = "queued" | "running" | "success" | "error"

type Run = {
    id: string
    command: string
    status: RunStatus
    createdAt: string
    output: string
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080"
const API_KEY_DOC_URL = "https://aistudio.google.com/app/apikey"

const getApiKey = (): string => {
    if (typeof window === "undefined") return ""
    try {
        const stored = window.localStorage?.getItem("gemini_api_key")
        if (stored) return stored
    } catch (error) {
        console.warn("Unable to read API key from localStorage", error)
    }
    return process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
}

const DEFAULT_MODEL = "gemini-2.5-flash"
const DEFAULT_CONFIG = {
    temperature: 0.3,
    maxTokens: 4000
}

function useSelectedNoteData(){
    const { selectedNoteId } = useSelectedNote()
    const notes = getNotes()
    const note = notes.find(n => String(n.id) === String(selectedNoteId))
    return note
}

type AgentInterfaceProps = {
    apiKey?: string
    hasApiKey?: boolean
    onApiKeyChange?: (value: string) => void
}

export default function AgentInterface({ apiKey: propApiKey = "", hasApiKey: propHasApiKey = false, onApiKeyChange }: AgentInterfaceProps = {}){
    const note = useSelectedNoteData()
    const [command, setCommand] = React.useState("")
    const [runs, setRuns] = React.useState<Run[]>([])
    const [copiedId, setCopiedId] = React.useState<string | null>(null)
    const [hasApiKey, setHasApiKey] = React.useState<boolean>(propHasApiKey)
    const wsRef = React.useRef<WebSocket | null>(null)
    const reconnectTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
    const pendingQueriesRef = React.useRef<Map<string, { resolve: (response: any) => void, reject: (error: any) => void }>>(new Map())
    const isConnectingRef = React.useRef<boolean>(false)
    const shouldReconnectRef = React.useRef<boolean>(true)
    const apiKeyRef = React.useRef<string>("")
    const scrollContainerRef = React.useRef<HTMLDivElement | null>(null)
    const scrollAnimationRef = React.useRef<number | null>(null)
    const [inlineKey, setInlineKey] = React.useState<string>("")
    const [inlineShowKey, setInlineShowKey] = React.useState<boolean>(false)
    const [inlineStatus, setInlineStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle")
    const [inlineError, setInlineError] = React.useState<string>("")
    
    const actualApiKey = React.useMemo(() => {
        const key = propApiKey || getApiKey()
        if (key !== apiKeyRef.current) {
            apiKeyRef.current = key
        }
        return key
    }, [propApiKey, hasApiKey])

    const promptSuggestions = [
        { icon: Sunrise, text: "Morning boost", prompt: "Give me a motivational quote to start my day", isGeneral: true },
        { icon: Zap, text: "Productivity hack", prompt: "Share a quick productivity tip I can use today", isGeneral: true },
        { icon: BookOpen, text: "Quote of the day", prompt: "Give me an inspiring quote of the day", isGeneral: true },
    ]

    const quickActions = [
        { icon: RefreshCw, text: "Catch me up", prompt: "Give me a brief summary of all my notes and tasks to catch me up on what I've been working on", isGeneral: false },
        { icon: CheckSquare, text: "Find action items", prompt: "Scan through all my notes and pull out a checklist of to-dos, action items, and next steps that I need to complete", isGeneral: false },
        { icon: BarChart3, text: "What's important?", prompt: "Review all my notes and tell me what are the most important topics, deadlines, or action items I should focus on", isGeneral: false },
    ]

    React.useEffect(() => {
        setHasApiKey(propHasApiKey)
    }, [propHasApiKey])

    React.useEffect(() => {
        setInlineKey("")
        setInlineError("")
        setInlineStatus("idle")
        setInlineShowKey(false)
    }, [hasApiKey])

    const enqueueRef = React.useRef<(cmd: string) => Promise<void>>(async () => {})
    
    React.useEffect(() => {
        const handleAiQuery = (event: CustomEvent) => {
            const { prompt } = event.detail || {}
            if (prompt && hasApiKey && enqueueRef.current) {
                enqueueRef.current(prompt)
            }
        }

        window.addEventListener("nimble:ai-query", handleAiQuery as EventListener)
        return () => {
            window.removeEventListener("nimble:ai-query", handleAiQuery as EventListener)
        }
    }, [hasApiKey])

    React.useEffect(() => {
        let mounted = true
        shouldReconnectRef.current = true

        const connectWebSocket = () => {
            if (!mounted) {
                return
            }
            
            const apiKey = apiKeyRef.current || getApiKey()
            if (!apiKey) {
                console.log("No API key, skipping WebSocket connection")
                return
            }

            if (isConnectingRef.current) {
                console.log("Already connecting, skipping...")
                return
            }

            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                console.log("WebSocket already connected")
                return
            }

            if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
                console.log("Closing existing connection...")
                wsRef.current.close()
            }

            isConnectingRef.current = true

            try {
                console.log("Attempting to connect WebSocket...")
                const ws = new WebSocket(WS_URL)
                wsRef.current = ws

                ws.onopen = () => {
                    if (!mounted) {
                        ws.close()
                        return
                    }
                    console.log("WebSocket connected successfully")
                    isConnectingRef.current = false
                    if (reconnectTimeoutRef.current) {
                        clearTimeout(reconnectTimeoutRef.current)
                        reconnectTimeoutRef.current = null
                    }
                }

                ws.onmessage = (event) => {
                    if (!mounted) return
                    try {
                        const response = JSON.parse(event.data.toString())
                        
                        if (response.queryId && pendingQueriesRef.current.has(response.queryId)) {
                            const { resolve } = pendingQueriesRef.current.get(response.queryId)!
                            pendingQueriesRef.current.delete(response.queryId)
                            resolve(response)
                            return
                        }

                        console.warn("Received response without queryId")
                    } catch (error) {
                        console.error("Failed to parse WebSocket message:", error)
                    }
                }

                ws.onerror = (error) => {
                    if (!mounted) return
                    console.error("WebSocket error:", error)
                    isConnectingRef.current = false
                }

                ws.onclose = (event) => {
                    if (!mounted) return
                    console.log("WebSocket disconnected", event.code, event.reason)
                    isConnectingRef.current = false
                    wsRef.current = null
                    
                    const apiKey = apiKeyRef.current || getApiKey()
                    if (shouldReconnectRef.current && mounted && apiKey && event.code !== 1000) {
                        console.log("Scheduling reconnect in 3 seconds...")
                        reconnectTimeoutRef.current = setTimeout(() => {
                            if (shouldReconnectRef.current && mounted) {
                                connectWebSocket()
                            }
                        }, 3000)
                    }
                }
            } catch (error) {
                console.error("Failed to create WebSocket connection:", error)
                isConnectingRef.current = false
            }
        }

        if (!actualApiKey) {
            if (wsRef.current) {
                wsRef.current.close(1000, "API key removed")
                wsRef.current = null
            }
            pendingQueriesRef.current.clear()
            return () => {
                mounted = false
            }
        }

        const connectTimeout = setTimeout(() => {
            if (mounted) {
                connectWebSocket()
            }
        }, 100)

        return () => {
            mounted = false
            shouldReconnectRef.current = false
            if (connectTimeout) {
                clearTimeout(connectTimeout)
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
                reconnectTimeoutRef.current = null
            }
            if (wsRef.current) {
                wsRef.current.close(1000, "Component unmounting")
                wsRef.current = null
            }
            pendingQueriesRef.current.clear()
        }
    }, [actualApiKey])

    const enqueue = React.useCallback(async (cmd: string) => {
        const apiKey = actualApiKey || getApiKey()
        if (!apiKey) {
            setHasApiKey(false)
            return
        }

        const id = String(Date.now())
        const createdAt = new Date().toISOString()
        const next: Run = { id, command: cmd, status: "running", createdAt, output: "" }
        setRuns(prev => [next, ...prev])

        const isGeneralQuery = !cmd.toLowerCase().includes("my notes") && 
                               !cmd.toLowerCase().includes("my folders") &&
                               !cmd.toLowerCase().includes("in my notes") &&
                               !cmd.toLowerCase().includes("from my notes") &&
                               !cmd.toLowerCase().includes("summarize") &&
                               !cmd.toLowerCase().includes("find") &&
                               !cmd.toLowerCase().includes("analyze") &&
                               (cmd.toLowerCase().includes("quote") ||
                                cmd.toLowerCase().includes("motivation") ||
                                cmd.toLowerCase().includes("wisdom") ||
                                cmd.toLowerCase().includes("productivity tip") ||
                                cmd.toLowerCase().includes("creative") ||
                                cmd.toLowerCase().includes("learning insight") ||
                                cmd.toLowerCase().includes("tip"))

        const notes = isGeneralQuery ? [] : getNotes()
        const folders = isGeneralQuery ? [] : getFolders()

        const config = isGeneralQuery 
            ? { temperature: 0.9, maxTokens: 4000 }
            : DEFAULT_CONFIG

        const recentGeneralQueries = runs
            .filter(r => {
                if (r.status !== "success") return false
                const cmdLower = r.command.toLowerCase()
                return cmdLower.includes("quote") || cmdLower.includes("motivation") || cmdLower.includes("productivity tip")
            })
            .slice(0, 5)
            .map(r => ({ command: r.command, response: r.output }))

        try {
            let ws = wsRef.current
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                let attempts = 0
                while (attempts < 50) {
                    await new Promise(resolve => setTimeout(resolve, 100))
                    ws = wsRef.current
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        break
                    }
                    attempts++
                }

                ws = wsRef.current
                if (!ws || ws.readyState !== WebSocket.OPEN) {
                    setRuns(prev => prev.map(r => r.id === id ? { 
                        ...r, 
                        status: "error", 
                        output: "WebSocket not connected. Please wait a moment and try again. Make sure the WebSocket server is running on ws://localhost:8080" 
                    } : r))
                    return
                }
            }

            const queryPromise = new Promise<any>((resolve, reject) => {
                pendingQueriesRef.current.set(id, { resolve, reject })

                setTimeout(() => {
                    if (pendingQueriesRef.current.has(id)) {
                        pendingQueriesRef.current.delete(id)
                        reject(new Error("Request timeout: No response received within 60 seconds."))
                    }
                }, 60000)
            })

            const message = {
                queryId: id,
                message: cmd,
                apiKey: apiKey,
                model: DEFAULT_MODEL,
                config: config,
                operationType: "query" as const,
                notes: isGeneralQuery ? "" : JSON.stringify(notes),
                folders: isGeneralQuery ? "" : JSON.stringify(folders),
                conversationHistory: isGeneralQuery ? recentGeneralQueries : []
            }
            ws.send(JSON.stringify(message))

            try {
                const response = await queryPromise
                
                if (response.success && response.type === "query") {
                    setRuns(prev => prev.map(r => r.id === id ? { 
                        ...r, 
                        status: "success", 
                        output: response.response || "No response received" 
                    } : r))
                } else if (response.error) {
                    setRuns(prev => prev.map(r => r.id === id ? { 
                        ...r, 
                        status: "error", 
                        output: `Error: ${response.error}` 
                    } : r))
                    if (response.error.includes("API key") || response.error.includes("apiKey")) {
                        setHasApiKey(false)
                    }
                } else {
                    setRuns(prev => prev.map(r => r.id === id ? { 
                        ...r, 
                        status: "error", 
                        output: `Unexpected response format: ${JSON.stringify(response)}` 
                    } : r))
                }
            } catch (error) {
                setRuns(prev => prev.map(r => r.id === id ? { 
                    ...r, 
                    status: "error", 
                    output: error instanceof Error ? error.message : String(error)
                } : r))
            }

        } catch (error) {
            setRuns(prev => prev.map(r => r.id === id ? { 
                ...r, 
                status: "error", 
                output: `Failed to send query: ${error instanceof Error ? error.message : String(error)}` 
            } : r))
        }
    }, [actualApiKey, runs])
    
    React.useEffect(() => {
        enqueueRef.current = enqueue
    }, [enqueue])

    const scrollToTop = React.useCallback((opts?: { immediate?: boolean }) => {
        const el = scrollContainerRef.current
        if (!el) return
        if (scrollAnimationRef.current) {
            cancelAnimationFrame(scrollAnimationRef.current)
            scrollAnimationRef.current = null
        }
        if (opts?.immediate) {
            el.scrollTop = 0
            return
        }

        const start = el.scrollTop
        const duration = 420
        const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5)
        let startTime: number | null = null

        const step = (timestamp: number) => {
            if (startTime === null) startTime = timestamp
            const elapsed = timestamp - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = easeOutQuint(progress)
            el.scrollTop = start * (1 - eased)
            if (progress < 1) {
                scrollAnimationRef.current = requestAnimationFrame(step)
            } else {
                scrollAnimationRef.current = null
            }
        }

        scrollAnimationRef.current = requestAnimationFrame(step)
    }, [])

    React.useEffect(() => {
        return () => {
            if (scrollAnimationRef.current) {
                cancelAnimationFrame(scrollAnimationRef.current)
            }
        }
    }, [])

    const persistKeyLocally = React.useCallback((value: string): boolean => {
        const trimmed = value.trim()
        if (!trimmed || typeof window === "undefined") return false
        try {
            window.localStorage?.setItem("gemini_api_key", trimmed)
        } catch (error) {
            console.warn("Unable to persist API key to localStorage", error)
            setHasApiKey(false)
            return false
        }
        setHasApiKey(true)
        return true
    }, [])

    const handleInlineKeySubmit = () => {
        const trimmed = inlineKey.trim()
        if (!trimmed) {
            setInlineStatus("error")
            setInlineError("Enter your Gemini API key to continue.")
            return
        }
        setInlineStatus("saving")
        setInlineError("")
        const success = onApiKeyChange
            ? (() => {
                onApiKeyChange(trimmed)
                return true
            })()
            : persistKeyLocally(trimmed)

        if (!success) {
            setInlineStatus("error")
            setInlineError("We couldn't store the key in this browser. Check storage permissions and try again.")
            return
        }
        setInlineStatus("saved")
        setHasApiKey(true)
        setInlineKey("")
    }

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!command.trim()) return
        if (!hasApiKey) {
            setRuns(prev => [{
                id: String(Date.now()),
                command: command.trim(),
                status: "error",
                createdAt: new Date().toISOString(),
                output: "Error: API key not configured. Please set your Gemini API key in localStorage with key 'gemini_api_key' or set NEXT_PUBLIC_GEMINI_API_KEY environment variable.\n\nTo set it, open browser console and run:\nlocalStorage.setItem('gemini_api_key', 'YOUR_API_KEY_HERE')"
            }, ...prev])
            return
        }
        enqueue(command.trim())
        scrollToTop()
        setCommand("")
    }

    React.useEffect(() => {
        if (runs.length === 0) return
        scrollToTop({ immediate: runs.length <= 1 })
    }, [runs, scrollToTop])

    const copyOutput = async (id: string, text: string) => {
        try{ await navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(()=>setCopiedId(null), 1000) } catch {}
    }

    return (
        <div className="h-full w-full flex flex-col bg-background dark:bg-[#282c34] overflow-hidden border-l border-border/50 dark:border-[#4a5568]">
                <div className="px-3 md:px-5 py-2.5 md:py-3.5 border-b border-border/50 dark:border-[#4a5568] dark:bg-[#282c34]">
                    <form onSubmit={onSubmit} className="space-y-2 md:space-y-3">
                        <div className="relative group">
                            <div className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 text-primary/70 dark:text-[#4fc3f7]/70 group-focus-within:text-primary dark:group-focus-within:text-[#4fc3f7] transition-colors z-10">
                                <Command className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            </div>
                            <input
                                value={command}
                                onChange={(e)=>setCommand(e.target.value)}
                                placeholder={hasApiKey ? "Ask anything or use quick actions..." : "Set API key below to use AI"}
                                disabled={!hasApiKey}
                                className="w-full pl-9 md:pl-10 pr-16 md:pr-20 py-1.5 md:py-2 rounded-lg border border-border/60 dark:border-[#4a5568] bg-input dark:bg-[#3e4451] text-xs md:text-sm placeholder:text-muted-foreground/60 dark:placeholder:text-[#828997] dark:text-[#d4d4d4] focus:outline-none focus:ring-2 focus:ring-primary/30 dark:focus:ring-[#4fc3f7]/40 focus:border-primary/50 dark:focus:border-[#4fc3f7] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <button 
                                type="submit" 
                                disabled={!command.trim() || !hasApiKey}
                                className="absolute right-1 md:right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 md:gap-1.5 rounded-md bg-primary text-primary-foreground px-2 md:px-2.5 py-1 md:py-1.5 text-[10px] md:text-[11px] font-medium transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary shadow-sm"
                            >
                                <Play className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                <span className="hidden sm:inline">Run</span>
                            </button>
                        </div>
                    
                    {hasApiKey && (
                        <div className="flex flex-col gap-2.5">
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-1.5">
                                    <SparklesIcon className="h-3 w-3 text-muted-foreground/70 dark:text-[#9cdcfe]" />
                                    <span className="text-[10px] md:text-[11px] text-muted-foreground/70 dark:text-[#9cdcfe] font-medium">Daily Boost</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1 md:gap-1.5">
                                    {promptSuggestions.map((suggestion, idx) => {
                                        const Icon = suggestion.icon
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => {
                                                    enqueue(suggestion.prompt)
                                                    scrollToTop()
                                                }}
                                                className="inline-flex items-center gap-1 md:gap-1.5 rounded-md border border-border/60 dark:border-[#4a5568] bg-secondary/50 dark:bg-[#3e4451] px-1.5 md:px-2 py-0.5 md:py-1 text-[10px] md:text-[11px] font-medium transition-all hover:bg-secondary dark:hover:bg-[#4a5568] hover:border-border dark:hover:border-[#4fc3f7] active:scale-95 dark:text-[#9cdcfe] dark:hover:text-[#4fc3f7]"
                                                title={suggestion.prompt}
                                            >
                                                <Icon className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                                <span>{suggestion.text}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-1.5">
                                    <BookOpenIcon className="h-3 w-3 text-muted-foreground/70 dark:text-[#9cdcfe]" />
                                    <span className="text-[10px] md:text-[11px] text-muted-foreground/70 dark:text-[#9cdcfe] font-medium">Your Notes</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1 md:gap-1.5">
                                    {quickActions.map((action, idx) => {
                                        const Icon = action.icon
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => {
                                                    enqueue(action.prompt)
                                                    scrollToTop()
                                                }}
                                                className="inline-flex items-center gap-1 md:gap-1.5 rounded-md border border-border/60 dark:border-[#4a5568] bg-secondary/50 dark:bg-[#3e4451] px-1.5 md:px-2 py-0.5 md:py-1 text-[10px] md:text-[11px] font-medium transition-all hover:bg-secondary dark:hover:bg-[#4a5568] hover:border-border dark:hover:border-[#4fc3f7] active:scale-95 dark:text-[#9cdcfe] dark:hover:text-[#4fc3f7]"
                                                title={action.prompt}
                                            >
                                                <Icon className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                                <span>{action.text}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                    {!hasApiKey && (
                        <div className="rounded-md border border-border/60 dark:border-[#3a3f4b] bg-secondary/30 dark:bg-[#252a33] px-3 py-3 md:px-4 md:py-4 space-y-2.5">
                            <div className="flex items-start gap-2">
                                <KeyRound className="h-4 w-4 text-muted-foreground/80 dark:text-[#9cdcfe]" />
                                <div>
                                    <p className="text-[11px] font-medium text-foreground/90 dark:text-[#d4d4d4]">Bring your own Gemini key</p>
                                    <p className="text-[11px] leading-relaxed text-muted-foreground/90 dark:text-[#b5c6f1]">
                                        Your key never leaves this browser, it stays in your  local-storage.
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="relative">
                                    <Key className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 dark:text-[#828997]" />
                                    <input
                                        type={inlineShowKey ? "text" : "password"}
                                        value={inlineKey}
                                        onChange={(e) => {
                                            setInlineKey(e.target.value)
                                            if (inlineStatus === "error") {
                                                setInlineStatus("idle")
                                                setInlineError("")
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault()
                                                handleInlineKeySubmit()
                                            }
                                        }}
                                        placeholder="Enter your Gemini API key"
                                        autoComplete="off"
                                        className="w-full pl-9 pr-20 py-1.5 rounded-md border border-border/60 dark:border-[#4a5568] bg-background/80 dark:bg-[#2c313c] text-[11px] placeholder:text-muted-foreground/60 dark:placeholder:text-[#828997] dark:text-[#d4d4d4] focus:outline-none focus:ring-2 focus:ring-primary/30 dark:focus:ring-[#4fc3f7]/40 focus:border-primary/50 dark:focus:border-[#4fc3f7] transition-all"
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setInlineShowKey((prev) => !prev)}
                                            className="p-1 rounded-md text-muted-foreground/60 dark:text-[#828997] hover:text-foreground dark:hover:text-[#4fc3f7] hover:bg-muted/30 dark:hover:bg-[#3e4451]/50 transition-colors"
                                            aria-label={inlineShowKey ? "Hide key" : "Show key"}
                                        >
                                            {inlineShowKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                        </button>
                                    </div>
                                </div>
                                {inlineError && (
                                    <p className="text-[10px] text-red-500 dark:text-red-300">{inlineError}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={inlineStatus === "saving"}
                                        onClick={handleInlineKeySubmit}
                                        className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-[11px] font-medium shadow-sm hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {inlineStatus === "saving" ? (
                                            <>
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                <span>Saving</span>
                                            </>
                                        ) : (
                                            <span>{inlineStatus === "saved" ? "Connected" : "Save & connect"}</span>
                                        )}
                                    </button>
                                    <a
                                        href={API_KEY_DOC_URL}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 rounded-md border border-border/50 dark:border-[#4a5568] px-2.5 py-1 text-[10px] text-muted-foreground/80 dark:text-[#9cdcfe]/80 hover:border-border dark:hover:border-[#4fc3f7] transition-colors"
                                    >
                                        Get a key
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/80 dark:text-[#9cdcfe]/80">
                                <ShieldCheck className="h-3 w-3 text-emerald-500/80 dark:text-emerald-300" />
                                <span>Stored locally, never on our servers.</span>
                            </div>
                        </div>
                    )}
                </form>
            </div>

            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                {runs.length > 0 && (
                    <div className="flex items-center justify-between px-3 md:px-5 py-2 border-b border-border/40 dark:border-[#4a5568]/50">
                        <span className="text-[10px] md:text-[11px] text-muted-foreground/70 dark:text-[#9cdcfe] font-medium">
                            {runs.length} {runs.length === 1 ? 'conversation' : 'conversations'}
                        </span>
                        <button
                            type="button"
                            onClick={() => setRuns([])}
                            className="inline-flex items-center gap-1 md:gap-1.5 rounded-md border border-border/60 dark:border-[#4a5568] bg-secondary/30 dark:bg-[#3e4451]/50 hover:bg-secondary/50 dark:hover:bg-[#4a5568] hover:border-border dark:hover:border-[#f48771]/50 active:scale-95 transition-all group px-1.5 md:px-2 py-0.5 md:py-1"
                            title="Clear history"
                        >
                            <Trash2 className="h-3 w-3 md:h-3.5 md:w-3.5 text-muted-foreground/70 dark:text-[#9cdcfe] group-hover:text-foreground dark:group-hover:text-[#f48771] transition-colors" />
                            <span className="text-[10px] md:text-[11px] font-medium text-muted-foreground/70 dark:text-[#9cdcfe] group-hover:text-foreground dark:group-hover:text-[#f48771] transition-colors hidden sm:inline">Clear</span>
                        </button>
                    </div>
                )}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 min-h-0 overflow-y-auto px-3 md:px-5 py-3 md:py-4 space-y-2 md:space-y-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                {runs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-16 px-4">
                        <div className="relative mb-5">
                            <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
                            <div className="relative inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-muted/60 to-muted/40 border border-border/40">
                                <Bot className="h-10 w-10 text-muted-foreground/60" />
                            </div>
                        </div>
                        <h3 className="font-medium text-sm mb-1.5 text-foreground/90 dark:text-[#d4d4d4]">Ready to assist</h3>
                        <p className="text-xs text-muted-foreground/70 dark:text-[#9cdcfe] max-w-[200px] leading-relaxed">
                            Type a command or use quick actions to get started
                        </p>
                    </div>
                ) : runs.map(run => (
                    <RunCard 
                        key={run.id} 
                        run={run} 
                        onCopy={() => copyOutput(run.id, run.output)}
                        copied={copiedId === run.id}
                    />
                ))}
                </div>
            </div>
        </div>
    )
}

function RunCard({ run, onCopy, copied }: { run: Run, onCopy: () => void, copied: boolean }){
    return (
        <div className="group/run rounded-lg border border-border/60 dark:border-[#4a5568] bg-card dark:bg-[#2c313c] transition-all hover:border-border/80 dark:hover:border-[#4fc3f7]/50">
            <div className="flex items-center justify-between px-2.5 md:px-3.5 py-2 md:py-2.5 border-b border-border/40 dark:border-[#4a5568] dark:bg-[#3e4451]/20 gap-2">
                <div className="flex items-center gap-1.5 md:gap-2 flex-1 min-w-0">
                    <div className="inline-flex items-center rounded-md bg-secondary/30 dark:bg-[#3e4451] border border-border/50 dark:border-[#4a5568] px-1.5 md:px-2 py-0.5 md:py-1 min-w-0">
                        <span className="text-[10px] md:text-[11px] font-medium text-foreground/90 dark:text-[#d4d4d4] truncate max-w-[100px] md:max-w-[140px]">{run.command}</span>
                    </div>
                    {run.status === "success" && (
                        <span className="inline-flex items-center gap-1 md:gap-1.5 text-[10px] md:text-[11px] whitespace-nowrap">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-[#a5d6a7] shrink-0" />
                            <span className="font-medium text-emerald-600 dark:text-[#a5d6a7] hidden sm:inline">Done</span>
                        </span>
                    )}
                    {run.status === "error" && (
                        <span className="inline-flex items-center gap-1 md:gap-1.5 text-[10px] md:text-[11px] whitespace-nowrap">
                            <div className="h-1.5 w-1.5 rounded-full bg-red-500 dark:bg-red-400 shrink-0" />
                            <span className="font-medium text-red-600 dark:text-red-400 hidden sm:inline">Error</span>
                        </span>
                    )}
                </div>
                {(run.status === "success" || run.status === "error") && (
                    <button 
                        onClick={onCopy}
                        className="inline-flex items-center gap-1 md:gap-1.5 rounded-md border border-border/60 dark:border-[#4a5568] bg-secondary/30 dark:bg-[#3e4451] px-1.5 md:px-2 py-0.5 md:py-1 text-[10px] md:text-[11px] font-medium transition-all hover:bg-secondary dark:hover:bg-[#4a5568] active:scale-95 shrink-0"
                    >
                        {copied ? (
                            <>
                                <Check className="h-2.5 w-2.5 md:h-3 md:w-3 text-emerald-500 dark:text-[#a5d6a7]" />
                                <span className="hidden sm:inline dark:text-[#a5d6a7]">Copied</span>
                            </>
                        ) : (
                            <>
                                <Clipboard className="h-2.5 w-2.5 md:h-3 md:w-3 dark:text-[#9cdcfe]" />
                                <span className="hidden sm:inline dark:text-[#9cdcfe]">Copy</span>
                            </>
                        )}
                    </button>
                )}
            </div>
            
            <div className="px-2.5 md:px-3.5 py-2 md:py-3">
                {run.status === "running" ? (
                    <div className="relative overflow-hidden rounded-md dark:bg-[#2c313c]/50 min-h-[120px]">
                        <div className="absolute inset-0 bg-linear-to-r from-transparent via-[#4fc3f7]/10 to-transparent" style={{ animation: 'shimmer 2s infinite' }}></div>
                        <div className="relative flex items-center justify-center h-full">
                            <div className="absolute inset-0 bg-[#4fc3f7]/20 blur-xl rounded-full animate-pulse"></div>
                        </div>
                    </div>
                ) : run.status === "error" ? (
                    <div className="font-sans text-[10px] md:text-xs leading-relaxed text-red-600 dark:text-red-400 bg-transparent p-0 m-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_p]:mb-2 [&_p]:leading-relaxed [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:mb-2 [&_li]:mb-1 [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-muted [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:mb-2">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {run.output}
                            </ReactMarkdown>
                        </div>
                ) : (
                    <div className="font-sans text-[10px] md:text-xs leading-relaxed text-foreground/90 dark:text-[#d4d4d4] bg-transparent p-0 m-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-foreground dark:[&_h1]:text-[#d4d4d4] [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-2 [&_h2]:text-foreground dark:[&_h2]:text-[#d4d4d4] [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-foreground dark:[&_h3]:text-[#d4d4d4] [&_p]:mb-2 [&_p]:leading-relaxed [&_p]:text-foreground/90 dark:[&_p]:text-[#d4d4d4] [&_strong]:font-semibold [&_strong]:text-foreground dark:[&_strong]:text-[#d4d4d4] [&_em]:italic [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:mb-2 [&_ul]:text-foreground/90 dark:[&_ul]:text-[#d4d4d4] [&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:mb-2 [&_ol]:text-foreground/90 dark:[&_ol]:text-[#d4d4d4] [&_li]:mb-1 [&_li]:text-foreground/90 dark:[&_li]:text-[#d4d4d4] [&_code]:bg-muted/50 dark:[&_code]:bg-[#3e4451]/50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_code]:text-foreground/90 dark:[&_code]:text-[#d4d4d4] [&_pre]:bg-muted/50 dark:[&_pre]:bg-[#3e4451]/50 [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:mb-2 [&_pre]:text-xs [&_blockquote]:border-l-4 [&_blockquote]:border-muted [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-2 [&_a]:text-primary [&_a]:underline [&_a]:hover:text-primary/80">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {run.output}
                            </ReactMarkdown>
                        </div>
                )}
            </div>
        </div>
    )
}
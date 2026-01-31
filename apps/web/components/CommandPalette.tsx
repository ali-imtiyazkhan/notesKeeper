"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { Search, FileText, Sparkles, ArrowRight, Folder, X } from "lucide-react"
import { getNotes, getFolders } from "@/services/localstorage"
import { useSelectedNote } from "@/components/notes/selected-note-context"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAiQuery?: (query: string) => void
}

export function CommandPalette({ open, onOpenChange, onAiQuery }: CommandPaletteProps) {
  const [search, setSearch] = React.useState("")
  const [notes, setNotes] = React.useState<ReturnType<typeof getNotes>>([])
  const [folders, setFolders] = React.useState<ReturnType<typeof getFolders>>([])
  const { setSelectedNoteId } = useSelectedNote()
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (open) {
      setNotes(getNotes())
      setFolders(getFolders())
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    } else {
      setSearch("")
    }
  }, [open])

  React.useEffect(() => {
    const handleNotesChanged = () => {
      setNotes(getNotes())
      setFolders(getFolders())
    }
    if (typeof window !== "undefined") {
      window.addEventListener("nimble:notes-changed", handleNotesChanged)
      return () => {
        window.removeEventListener("nimble:notes-changed", handleNotesChanged)
      }
    }
  }, [])

  const filteredNotes = React.useMemo(() => {
    if (!search.trim()) return notes.slice(0, 5)
    const lowerSearch = search.toLowerCase()
    return notes.filter(note => 
      note.title?.toLowerCase().includes(lowerSearch) ||
      note.content?.toLowerCase().includes(lowerSearch)
    ).slice(0, 10)
  }, [search, notes])

  const handleSelectNote = (noteId: string) => {
    setSelectedNoteId(noteId)
    onOpenChange(false)
    setSearch("")
  }

  const handleAiQuery = () => {
    if (search.trim() && onAiQuery) {
      onAiQuery(search.trim())
      onOpenChange(false)
      setSearch("")
    }
  }

  const getFolderName = (folderId: string | null) => {
    if (!folderId) return "Uncategorized"
    const folder = folders.find(f => String(f.id) === String(folderId))
    return folder?.name ?? "Uncategorized"
  }

  if (!open) return null

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed left-1/2 top-[20%] -translate-x-1/2 z-50 w-full max-w-2xl">
        <CommandPrimitive className="rounded-lg border border-border/60 dark:border-[#4a5568] bg-background dark:bg-[#2c313c] shadow-2xl overflow-hidden">
          <div className="flex items-center border-b border-border/50 dark:border-[#4a5568] px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 dark:text-[#9cdcfe]" />
            <CommandPrimitive.Input
              ref={inputRef}
              value={search}
              onValueChange={setSearch}
              placeholder="Search notes or ask AI..."
              className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground dark:placeholder:text-[#828997] dark:text-[#d4d4d4] disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              onClick={() => onOpenChange(false)}
              className="ml-2 p-1.5 rounded-md hover:bg-muted/50 dark:hover:bg-[#3e4451] transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground dark:text-[#828997]" />
            </button>
          </div>
          <CommandPrimitive.List className="max-h-[400px] overflow-y-auto p-2 [scrollbar-width:thin] [scrollbar-color:rgba(156,220,254,0.3)_transparent] dark:[scrollbar-color:rgba(79,195,247,0.2)_transparent]">
            {search.trim() && (
              <CommandPrimitive.Group>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground dark:text-[#9cdcfe]">AI Query</div>
                <CommandPrimitive.Item
                  onSelect={handleAiQuery}
                  className="flex items-center gap-2 rounded-md px-2 py-2.5 text-sm cursor-pointer hover:bg-accent dark:hover:bg-[#3e4451] transition-colors aria-selected:bg-accent dark:aria-selected:bg-[#3e4451]"
                >
                  <Sparkles className="h-4 w-4 text-primary dark:text-[#4fc3f7] shrink-0" />
                  <span className="flex-1 dark:text-[#d4d4d4]">Ask AI: "{search}"</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground dark:text-[#828997] shrink-0" />
                </CommandPrimitive.Item>
              </CommandPrimitive.Group>
            )}
            <CommandPrimitive.Group>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground dark:text-[#9cdcfe]">Notes</div>
              {filteredNotes.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground dark:text-[#828997]">
                  {search.trim() ? "No notes found" : "Start typing to search notes..."}
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <CommandPrimitive.Item
                    key={note.id}
                    value={`${note.title} ${note.content}`}
                    onSelect={() => handleSelectNote(String(note.id))}
                    className="flex items-center gap-2 rounded-md px-2 py-2.5 text-sm cursor-pointer hover:bg-accent dark:hover:bg-[#3e4451] transition-colors aria-selected:bg-accent dark:aria-selected:bg-[#3e4451]"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground dark:text-[#9cdcfe] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium dark:text-[#d4d4d4] truncate">{note.title || "Untitled"}</div>
                      <div className="text-xs text-muted-foreground dark:text-[#828997] truncate">
                        {getFolderName(note.folderId)}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground dark:text-[#828997] shrink-0" />
                  </CommandPrimitive.Item>
                ))
              )}
            </CommandPrimitive.Group>
            {!search.trim() && (
              <div className="px-2 py-3 text-xs text-muted-foreground dark:text-[#828997] text-center border-t border-border/50 dark:border-[#4a5568] mt-2">
                <kbd className="px-1.5 py-0.5 rounded bg-muted dark:bg-[#3e4451] border border-border/50 dark:border-[#4a5568]">Esc</kbd> to close
              </div>
            )}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </div>
    </>
  )
}


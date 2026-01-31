"use client";

import * as React from "react";
import { ChevronRight, Plus, Trash2, Pencil, FolderPlus, FileText, Sparkles, Lightbulb, Zap, BookOpen, CircleDot, GripVertical, Edit, ChevronLeft, type LucideIcon } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableFolderItem({
  id,
  item,
  editMode = false,
  openById,
  setOpenById,
  writeOpenMap,
  editingFolderId,
  editFolderName,
  onChangeEditFolderName,
  onConfirmEditFolder,
  onCancelEditFolder,
  onStartPickIcon,
  onStartEditFolder,
  onDeleteFolder,
  onStartAddNote,
  onAddNote,
  selectedNoteId,
  onSelectNote,
  itemItems,
  addingNoteForFolderId,
  newNoteTitle,
  onChangeNewNoteTitle,
  onConfirmAddNote,
  onCancelAddNote,
  onDeleteNote,
  noteInputRef,
  onReorderNotes,
  onMoveNote,
  hoveredFolderId,
  activeId,
  isFirstItem = false,
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `folder-${id}`, disabled: !editMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.4 : 1,
    scale: isDragging ? 0.95 : 1,
  };

  const folderId = String(id ?? item.title);
  const isOpen = openById[folderId] ?? false;
  const isHovered = hoveredFolderId === folderId && activeId?.startsWith('note-');
  const isNoteBeingDragged = activeId?.startsWith('note-');

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`transition-all duration-200 ${isDragging ? 'z-50' : ''} px-1 group-data-[collapsible=icon]:px-0 ${isFirstItem ? 'pt-0.5' : ''}`}
    >
      <Collapsible
        asChild
        open={isOpen}
        onOpenChange={(val) => {
          setOpenById((prev: Record<string, boolean>) => {
            const next = { ...prev, [folderId]: val };
            writeOpenMap(next);
            return next;
          });
        }}
        className="group/collapsible"
      >
        <SidebarMenuItem className="group/item transition-all">
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={item.title} className={`cursor-pointer relative pr-16 group-data-[collapsible=icon]:pr-0 transition-all duration-200 ${isDragging ? 'ring-2 ring-primary/20 dark:ring-[#4fc3f7]/30 shadow-lg bg-muted/50 dark:bg-[#3e4451]/80 scale-[0.98]' : isHovered ? 'ring-2 ring-primary/30 dark:ring-[#4fc3f7]/40 bg-primary/5 dark:bg-[#4fc3f7]/10 shadow-md' : ''}`}>
              {editMode && (
                <div
                  {...attributes}
                  {...listeners}
                  className="inline-flex items-center justify-center w-5 h-5 mr-1.5 cursor-grab active:cursor-grabbing text-muted-foreground/60 dark:text-[#828997] hover:text-foreground dark:hover:text-[#4fc3f7] transition-colors rounded hover:bg-muted/50 dark:hover:bg-[#4a5568]/50 touch-none"
                  title="Drag to reorder"
                  onClick={(e) => e.stopPropagation()}
                >
                  <GripVertical size={16} className="opacity-70" />
                </div>
              )}
              <span
                role="button"
                tabIndex={0}
                className="inline-flex items-center justify-center w-4 h-4"
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  onStartPickIcon?.(folderId, { x: rect.left, y: rect.bottom + 4 });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    onStartPickIcon?.(folderId, { x: rect.left, y: rect.bottom + 4 });
                  }
                }}
                title="Change icon"
                aria-label="Change icon"
              >
                {item.icon && <item.icon className="dark:text-[#4fc3f7]" />}
              </span>
              {editingFolderId === folderId ? (
                <input
                  autoFocus
                  value={editFolderName}
                  onChange={(e) => onChangeEditFolderName?.(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onConfirmEditFolder?.();
                    if (e.key === 'Escape') onCancelEditFolder?.();
                  }}
                  onBlur={() => onCancelEditFolder?.()}
                  className="ml-2 flex-1 bg-transparent outline-none border-b border-primary dark:border-[#4fc3f7] dark:text-[#d4d4d4]"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="ml-2 group-data-[collapsible=icon]:ml-0 block overflow-hidden text-ellipsis whitespace-nowrap transition-all group-hover/item:max-w-[calc(100%-5rem)] max-w-full dark:text-[#d4d4d4] dark:group-hover/item:text-[#4fc3f7]">{item.title}</span>
              )}
              <div className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 transition-opacity group-hover/item:opacity-100 group-data-[collapsible=icon]:hidden">
                {typeof id !== 'undefined' && id !== "" && (
                  <>
                    <span
                      role="button"
                      tabIndex={0}
                      className="pointer-events-auto cursor-pointer p-1 rounded hover:bg-muted dark:hover:bg-[#4a5568] dark:text-[#9cdcfe] dark:hover:text-[#4fc3f7]"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartEditFolder?.(folderId);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') onStartEditFolder?.(folderId);
                      }}
                      aria-label="Edit folder name"
                      title="Edit folder name"
                    >
                      <Pencil size={14} />
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      className="pointer-events-auto cursor-pointer p-1 rounded hover:bg-muted dark:hover:bg-[#4a5568] dark:text-[#9cdcfe] dark:hover:text-[#f48771]"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFolder?.(folderId);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') onDeleteFolder?.(folderId);
                      }}
                      aria-label="Delete folder"
                      title="Delete folder"
                    >
                      <Trash2 size={14} />
                    </span>
                  </>
                )}
                <span
                  role="button"
                  tabIndex={0}
                  className="pointer-events-auto cursor-pointer p-1 rounded hover:bg-muted dark:hover:bg-[#4a5568] dark:text-[#9cdcfe] dark:hover:text-[#a5d6a7]"
                  onClick={(e) => {
                    e.stopPropagation();
                    const fid = (id ?? null) as any;
                    if (onStartAddNote) onStartAddNote(fid);
                    else onAddNote?.(fid);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      const fid = (id ?? null) as any;
                      if (onStartAddNote) onStartAddNote(fid);
                      else onAddNote?.(fid);
                    }
                  }}
                  aria-label="Add note"
                  title="Add note"
                >
                  <Plus size={14} />
                </span>
              </div>
              <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden dark:text-[#9cdcfe]" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SortableNotesList
              folderId={id}
              notes={itemItems || []}
              editMode={editMode}
              selectedNoteId={selectedNoteId}
              onSelectNote={onSelectNote}
              addingNoteForFolderId={addingNoteForFolderId}
              newNoteTitle={newNoteTitle}
              onChangeNewNoteTitle={onChangeNewNoteTitle}
              onConfirmAddNote={onConfirmAddNote}
              onCancelAddNote={onCancelAddNote}
              onDeleteNote={onDeleteNote}
              noteInputRef={noteInputRef}
              onReorderNotes={onReorderNotes}
              onMoveNote={onMoveNote}
            />
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    </div>
  );
}

function SortableNoteItem({
  id,
  title,
  isSelected,
  editMode = false,
  onSelectNote,
  onDeleteNote,
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `note-${id}`, disabled: !editMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.4 : 1,
    scale: isDragging ? 0.95 : 1,
  };

  return (
    <SidebarMenuSubItem 
      ref={setNodeRef} 
      style={style}
      className={`transition-all duration-200 overflow-hidden ${isDragging ? 'z-50' : ''}`}
    >
      <SidebarMenuSubButton 
        asChild 
        className={`cursor-pointer w-full transition-all duration-200 overflow-hidden rounded-md ${isDragging ? 'ring-2 ring-primary/20 dark:ring-[#4fc3f7]/30 shadow-lg bg-muted/50 dark:bg-[#3e4451]/80 scale-[0.98]' : 'hover:bg-muted/20 dark:hover:bg-[#3e4451]/20'}`}
      >
        <button
          type="button"
          className={`w-full text-left relative pr-8 py-1.5 px-2 group/sub dark:text-[#d4d4d4] dark:hover:text-[#ce93d8] overflow-hidden rounded-md ${isSelected ? 'dark:bg-[#3e4451]/50 dark:text-[#ce93d8]' : ''}`}
          onClick={() => onSelectNote?.(id)}
        >
          <div className="flex items-center gap-1.5 w-full">
            {editMode && (
              <div
                {...attributes}
                {...listeners}
                className="inline-flex items-center justify-center w-4 h-4 shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/60 dark:text-[#828997] hover:text-foreground dark:hover:text-[#4fc3f7] transition-colors rounded hover:bg-muted/50 dark:hover:bg-[#4a5568]/50 touch-none"
                title="Drag to reorder or move"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical size={14} className="opacity-70" />
              </div>
            )}
            <span className="block flex-1 overflow-hidden text-ellipsis whitespace-nowrap min-w-0">{title}</span>
          </div>
          <span
            role="button"
            tabIndex={0}
            title="Delete note"
            aria-label="Delete note"
            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/sub:opacity-100 transition-opacity p-1 rounded hover:bg-muted dark:hover:bg-[#4a5568] dark:text-[#9cdcfe] dark:hover:text-[#f48771]"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteNote?.(id);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onDeleteNote?.(id);
            }}
          >
            <Trash2 size={14} />
          </span>
        </button>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}

function SortableNotesList({
  folderId,
  notes,
  editMode = false,
  selectedNoteId,
  onSelectNote,
  addingNoteForFolderId,
  newNoteTitle,
  onChangeNewNoteTitle,
  onConfirmAddNote,
  onCancelAddNote,
  onDeleteNote,
  noteInputRef,
  onReorderNotes,
  onMoveNote,
}: any) {
  const noteIds = notes.map((n: any) => n.id);
  const folderIdStr = folderId === "" || folderId === null ? null : String(folderId);

  return (
    <SidebarMenuSub>
      <SortableContext items={noteIds.map((id: string) => `note-${id}`)} strategy={verticalListSortingStrategy}>
        {notes.map((note: any) => (
          <SortableNoteItem
            key={note.id}
            id={note.id}
            title={note.title}
            isSelected={selectedNoteId === note.id}
            editMode={editMode}
            onSelectNote={onSelectNote}
            onDeleteNote={onDeleteNote}
          />
        ))}
      </SortableContext>
      {addingNoteForFolderId === folderId && (
        <SidebarMenuSubItem>
          <div className="px-2 py-0.5">
            <input
              autoFocus
              ref={noteInputRef}
              value={newNoteTitle}
              onChange={(e) => onChangeNewNoteTitle?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onConfirmAddNote?.();
                if (e.key === 'Escape') onCancelAddNote?.();
              }}
              placeholder="New note title"
              className="w-full bg-transparent outline-none text-sm dark:text-[#d4d4d4] dark:placeholder:text-[#828997]"
            />
          </div>
        </SidebarMenuSubItem>
      )}
    </SidebarMenuSub>
  );
}

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
  onSelectNote,
  selectedNoteId,
  onAddNote,
  onDeleteFolder,
  onStartEditFolder,
  editingFolderId,
  editFolderName,
  onChangeEditFolderName,
  onConfirmEditFolder,
  onCancelEditFolder,
  onStartPickIcon,
  pickingFolderId,
  pickingPosition,
  iconOptions,
  onPickIcon,
  onCancelPick,
  addingNoteForFolderId,
  newNoteTitle,
  onStartAddNote,
  onChangeNewNoteTitle,
  onConfirmAddNote,
  onCancelAddNote,
  onDeleteNote,
  addMode,
  newFolderName,
  onStartAdd,
  onChangeNewName,
  onConfirmAdd,
  onCancelAdd,
  editMode,
  onToggleEditMode,
  onReorderFolders,
  onReorderNotes,
  onMoveNote,
}: {
  items: {
    id?: string | null;
    title: string;
    url?: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      id: string;
      title: string;
      url?: string;
    }[];
  }[];
  onSelectNote?: (noteId: string) => void;
  selectedNoteId?: string | null;
  onAddNote?: (folderId: string | null) => void;
  onDeleteFolder?: (folderId: string) => void;
  onStartEditFolder?: (folderId: string) => void;
  editingFolderId?: string | null;
  editFolderName?: string;
  onChangeEditFolderName?: (value: string) => void;
  onConfirmEditFolder?: () => void;
  onCancelEditFolder?: () => void;
  onStartPickIcon?: (folderId: string, pos: { x: number; y: number }) => void;
  pickingFolderId?: string | null;
  pickingPosition?: { x: number; y: number } | null;
  iconOptions?: { key: string; Icon: LucideIcon }[];
  onPickIcon?: (folderId: string, key: string) => void;
  onCancelPick?: () => void;
  addingNoteForFolderId?: string | null;
  newNoteTitle?: string;
  onStartAddNote?: (folderId: string | null) => void;
  onChangeNewNoteTitle?: (value: string) => void;
  onConfirmAddNote?: () => void;
  onCancelAddNote?: () => void;
  onDeleteNote?: (noteId: string) => void;
  addMode?: boolean;
  newFolderName?: string;
  onStartAdd?: () => void;
  onChangeNewName?: (value: string) => void;
  onConfirmAdd?: () => void;
  onCancelAdd?: () => void;
  editMode?: boolean;
  onToggleEditMode?: () => void;
  onReorderFolders?: (folderIds: string[]) => void;
  onReorderNotes?: (noteIds: string[], folderId: string | null) => void;
  onMoveNote?: (noteId: string, targetFolderId: string | null) => void;
}) {
  const { state } = useSidebar();
  const [openById, setOpenById] = React.useState<Record<string, boolean>>({});
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [draggedItem, setDraggedItem] = React.useState<{ id: string; title: string; type: 'folder' | 'note' } | null>(null);
  const [savedOpenStates, setSavedOpenStates] = React.useState<Record<string, boolean> | null>(null);
  const [hoveredFolderId, setHoveredFolderId] = React.useState<string | null>(null);
  const OPEN_KEY = "folderOpenState";
  
  const isEditMode = editMode ?? false;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const readOpenMap = React.useCallback((): Record<string, boolean> => {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem(OPEN_KEY);
      const v = raw ? JSON.parse(raw) : {};
      return typeof v === "object" && v ? v : {};
    } catch {
      return {};
    }
  }, []);

  const writeOpenMap = React.useCallback((map: Record<string, boolean>) => {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(OPEN_KEY, JSON.stringify(map)); } catch {}
  }, []);
  const folderInputRef = React.useRef<HTMLInputElement | null>(null);
  const noteInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    setOpenById((prev) => {
      const stored = readOpenMap();
      const next = { ...stored, ...prev } as Record<string, boolean>;
      for (const it of items as any[]) {
        const id = String(it.id ?? it.title);
        if (!(id in next)) next[id] = !!it.isActive;
      }
      writeOpenMap(next);
      return next;
    });
  }, [items, readOpenMap, writeOpenMap]);

  React.useEffect(() => {
    if (addingNoteForFolderId == null) return;
    const id = String(addingNoteForFolderId);
    setOpenById((prev) => {
      const next = { ...prev, [id]: true };
      writeOpenMap(next);
      return next;
    });
  }, [addingNoteForFolderId, writeOpenMap]);

  React.useEffect(() => {
    const handleClickAway = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (addMode) {
        if (folderInputRef.current && !folderInputRef.current.contains(target)) {
          if (!newFolderName || newFolderName.trim() === "") {
            onCancelAdd?.();
          }
        }
      }
      if (addingNoteForFolderId != null) {
        if (noteInputRef.current && !noteInputRef.current.contains(target)) {
          if (!newNoteTitle || newNoteTitle.trim() === "") {
            onCancelAddNote?.();
          }
        }
      }
    };
    document.addEventListener("mousedown", handleClickAway);
    document.addEventListener("touchstart", handleClickAway);
    return () => {
      document.removeEventListener("mousedown", handleClickAway);
      document.removeEventListener("touchstart", handleClickAway);
    };
  }, [addMode, newFolderName, addingNoteForFolderId, newNoteTitle, onCancelAdd, onCancelAddNote]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const id = String(active.id).replace(/^(folder|note)-/, '');
    
    if (String(active.id).startsWith('folder-')) {
      const folder = items.find((item: any) => String(item.id) === id);
      if (folder) {
        setDraggedItem({ id, title: folder.title, type: 'folder' });
        setSavedOpenStates({ ...openById });
        const allClosed: Record<string, boolean> = {};
        items.forEach((item: any) => {
          const itemId = String(item.id ?? item.title);
          allClosed[itemId] = false;
        });
        setOpenById(allClosed);
      }
    } else if (String(active.id).startsWith('note-')) {
      for (const item of items) {
        const note = item.items?.find((n: any) => String(n.id) === id);
        if (note) {
          setDraggedItem({ id, title: note.title, type: 'note' });
          break;
        }
      }
    }
    setActiveId(String(active.id));
  };

  const expandTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !isEditMode) {
      setHoveredFolderId(null);
      if (expandTimeoutRef.current) {
        clearTimeout(expandTimeoutRef.current);
        expandTimeoutRef.current = null;
      }
      return;
    }

    const activeIdStr = String(active.id);
    const overId = String(over.id);

    if (activeIdStr.startsWith('note-') && overId.startsWith('folder-')) {
      const targetFolderId = overId.replace('folder-', '');
      const folderId = targetFolderId === "" ? "" : targetFolderId;
      
      if (hoveredFolderId !== folderId) {
        if (expandTimeoutRef.current) {
          clearTimeout(expandTimeoutRef.current);
        }
        
        setHoveredFolderId(folderId);
        
        expandTimeoutRef.current = setTimeout(() => {
          setOpenById((prev) => {
            if (!prev[folderId]) {
              const next = { ...prev, [folderId]: true };
              writeOpenMap(next);
              return next;
            }
            return prev;
          });
          expandTimeoutRef.current = null;
        }, 200);
      }
    } else if (activeIdStr.startsWith('note-') && overId.startsWith('note-')) {
      const targetNoteId = overId.replace('note-', '');
      for (const item of items) {
        const note = item.items?.find((n: any) => String(n.id) === targetNoteId);
        if (note) {
          const folderId = item.id === "" ? "" : String(item.id);
          if (hoveredFolderId !== folderId && !openById[folderId]) {
            if (expandTimeoutRef.current) {
              clearTimeout(expandTimeoutRef.current);
            }
            
            setHoveredFolderId(folderId);
            expandTimeoutRef.current = setTimeout(() => {
              setOpenById((prev) => {
                if (!prev[folderId]) {
                  const next = { ...prev, [folderId]: true };
                  writeOpenMap(next);
                  return next;
                }
                return prev;
              });
              expandTimeoutRef.current = null;
            }, 200);
          }
          break;
        }
      }
    } else {
      setHoveredFolderId(null);
      if (expandTimeoutRef.current) {
        clearTimeout(expandTimeoutRef.current);
        expandTimeoutRef.current = null;
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const wasDraggingFolder = String(active.id).startsWith('folder-');
    
    if (wasDraggingFolder && savedOpenStates) {
      setOpenById(savedOpenStates);
      writeOpenMap(savedOpenStates);
      setSavedOpenStates(null);
    }
    
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current);
      expandTimeoutRef.current = null;
    }
    setHoveredFolderId(null);
    setActiveId(null);
    setDraggedItem(null);

    if (!over || !isEditMode) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId.startsWith('folder-') && overId.startsWith('folder-')) {
      const activeFolderId = activeId.replace('folder-', '');
      const overFolderId = overId.replace('folder-', '');
      
      const folderIds = items.map((item: any) => String(item.id ?? item.title));
      const oldIndex = folderIds.indexOf(activeFolderId);
      const newIndex = folderIds.indexOf(overFolderId);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(folderIds, oldIndex, newIndex);
        onReorderFolders?.(reordered);
      }
    }
    else if (activeId.startsWith('note-') && overId.startsWith('note-')) {
      const noteId = activeId.replace('note-', '');
      const targetNoteId = overId.replace('note-', '');
      
      let sourceFolderId: string | null = null;
      let targetFolderId: string | null = null;
      
      for (const item of items) {
        const sourceNote = item.items?.find((n: any) => String(n.id) === noteId);
        const targetNote = item.items?.find((n: any) => String(n.id) === targetNoteId);
        
        if (sourceNote) sourceFolderId = item.id === "" ? null : String(item.id);
        if (targetNote) targetFolderId = item.id === "" ? null : String(item.id);
      }
      
      if (sourceFolderId === targetFolderId) {
        const folder = items.find((item: any) => (item.id === "" ? null : String(item.id)) === sourceFolderId);
        if (folder?.items) {
          const noteIds = folder.items.map((n: any) => String(n.id));
          const oldIndex = noteIds.indexOf(noteId);
          const newIndex = noteIds.indexOf(targetNoteId);
          
          if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            const reordered = arrayMove(noteIds, oldIndex, newIndex);
            onReorderNotes?.(reordered, sourceFolderId);
          }
        }
      } else {
        onMoveNote?.(noteId, targetFolderId);
      }
    }
    else if (activeId.startsWith('note-') && overId.startsWith('folder-')) {
      const noteId = activeId.replace('note-', '');
      const targetFolderId = overId.replace('folder-', '');
      const folderId = targetFolderId === "" ? null : targetFolderId;
      onMoveNote?.(noteId, folderId);
    }
  };

  const folderIds = items.map((item: any) => `folder-${String(item.id ?? item.title)}`);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        <p className="dark:text-[#d4d4d4]">Folders</p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className={`inline-flex items-center justify-center w-6 h-6 rounded-md cursor-pointer transition-all duration-200 ${
              isEditMode
                ? 'bg-primary/10 dark:bg-[#4fc3f7]/20 text-primary dark:text-[#4fc3f7] hover:bg-primary/20 dark:hover:bg-[#4fc3f7]/30'
                : 'text-muted-foreground hover:text-foreground dark:text-[#9cdcfe] dark:hover:text-[#4fc3f7] hover:bg-muted/50 dark:hover:bg-[#4a5568]/50'
            }`}
            onClick={onToggleEditMode}
            title={isEditMode ? "Exit edit mode" : "Edit mode - drag to reorder"}
          >
            <Edit size={14} />
          </button>
          <button 
            type="button" 
            className="inline-flex items-center justify-center w-6 h-6 rounded-md cursor-pointer text-muted-foreground hover:text-foreground dark:text-[#9cdcfe] dark:hover:text-[#4fc3f7] transition-all duration-200 hover:bg-muted/50 dark:hover:bg-[#4a5568]/50" 
            onClick={onStartAdd}
            title="Add folder"
          >
          <Plus size={14} />
        </button>
        </div>
      </SidebarGroupLabel>
      <SidebarMenu className="overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pt-1">
        {items.length === 0 && !addMode && state === "expanded" ? (
          <div className="px-2 py-6 flex flex-col items-center justify-center text-center space-y-1.5">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-muted/30 dark:bg-[#3e4451]">
              <FolderPlus className="h-5 w-5 text-muted-foreground dark:text-[#4fc3f7]" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium dark:text-[#d4d4d4]">No folders yet</p>
              <p className="text-xs text-muted-foreground dark:text-[#9cdcfe]">
                Start by creating your first folder
              </p>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={folderIds} strategy={verticalListSortingStrategy}>
              {items.map((item, index) => {
                const itemId = String((item as any).id ?? item.title);
                const isFirstItem = index === 0;
                return (
                  <SortableFolderItem
                    key={itemId}
                    id={(item as any).id}
                    item={item}
                    isFirstItem={isFirstItem}
                    editMode={isEditMode}
                    openById={openById}
                    setOpenById={setOpenById}
                    writeOpenMap={writeOpenMap}
                    editingFolderId={editingFolderId}
                    editFolderName={editFolderName}
                    onChangeEditFolderName={onChangeEditFolderName}
                    onConfirmEditFolder={onConfirmEditFolder}
                    onCancelEditFolder={onCancelEditFolder}
                    onStartPickIcon={onStartPickIcon}
                    onStartEditFolder={onStartEditFolder}
                    onDeleteFolder={onDeleteFolder}
                    onStartAddNote={onStartAddNote}
                    onAddNote={onAddNote}
                    selectedNoteId={selectedNoteId}
                    onSelectNote={onSelectNote}
                    itemItems={item.items}
                    addingNoteForFolderId={addingNoteForFolderId}
                    newNoteTitle={newNoteTitle}
                    onChangeNewNoteTitle={onChangeNewNoteTitle}
                    onConfirmAddNote={onConfirmAddNote}
                    onCancelAddNote={onCancelAddNote}
                    onDeleteNote={onDeleteNote}
                    noteInputRef={noteInputRef}
                    onReorderNotes={onReorderNotes}
                    onMoveNote={onMoveNote}
                    hoveredFolderId={hoveredFolderId}
                    activeId={activeId}
                  />
                );
              })}
            </SortableContext>
            <DragOverlay
              style={{
                cursor: 'grabbing',
              }}
              className="rotate-1 opacity-95"
            >
              {draggedItem ? (
                <div className="px-3 py-2.5 rounded-lg bg-background/95 dark:bg-[#2c313c]/95 border-2 border-primary/40 dark:border-[#4fc3f7]/60 shadow-2xl dark:text-[#d4d4d4] backdrop-blur-md min-w-[120px] flex items-center gap-2.5">
                  {draggedItem.type === 'folder' && (
                    <div className="flex items-center justify-center w-4 h-4 text-primary dark:text-[#4fc3f7]">
                      <GripVertical size={16} className="opacity-70" />
                    </div>
                  )}
                  {draggedItem.type === 'note' && (
                    <div className="flex items-center justify-center w-3 h-3 text-primary dark:text-[#4fc3f7]">
                      <GripVertical size={12} className="opacity-70" />
                    </div>
                  )}
                  <span className="font-medium text-sm truncate max-w-[200px] select-none">{draggedItem.title}</span>
                </div>
              ) : null}
            </DragOverlay>
            {addMode && (
            <SidebarMenuItem>
            <div className="px-2 py-1.5">
              <input
                autoFocus
              ref={folderInputRef}
                value={newFolderName}
                onChange={(e) => onChangeNewName?.(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onConfirmAdd?.();
                  if (e.key === 'Escape') onCancelAdd?.();
                }}
                placeholder="New folder name"
                className="w-full bg-transparent outline-none text-sm dark:text-[#d4d4d4] dark:placeholder:text-[#828997]"
              />
            </div>
            </SidebarMenuItem>
            )}
          </DndContext>
        )}
      </SidebarMenu>
      {pickingFolderId && iconOptions && pickingPosition && onCancelPick && (
        <IconPicker
          iconOptions={iconOptions}
          pickingPosition={pickingPosition}
          onPickIcon={(key) => onPickIcon?.(pickingFolderId, key)}
          onCancelPick={onCancelPick}
        />
      )}
    </SidebarGroup>
  );
}

function IconPicker({ iconOptions, pickingPosition, onPickIcon, onCancelPick }: { iconOptions: { key: string; Icon: LucideIcon }[], pickingPosition: { x: number; y: number }, onPickIcon: (key: string) => void, onCancelPick: () => void }) {
  const [currentPage, setCurrentPage] = React.useState(0);
  const iconsPerPage = 12;
  const totalPages = Math.ceil(iconOptions.length / iconsPerPage);
  const currentIcons = iconOptions.slice(currentPage * iconsPerPage, (currentPage + 1) * iconsPerPage);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onCancelPick} />
      <div className="fixed z-50 w-[200px] rounded-md border bg-background dark:bg-[#2c313c] dark:border-[#4a5568] shadow-lg overflow-hidden" style={{ left: pickingPosition.x, top: pickingPosition.y }}>
        <div className="grid grid-cols-6 gap-1 p-2">
          {currentIcons.map(({ key, Icon }) => (
            <span
              key={key}
              role="button"
              tabIndex={0}
              className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted dark:hover:bg-[#3e4451] cursor-pointer dark:text-[#4fc3f7] dark:hover:text-[#4fc3f7] transition-colors"
              title={key}
              onClick={(e) => { e.stopPropagation(); onPickIcon(key); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onPickIcon(key); } }}
            >
              <Icon size={14} />
            </span>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2 py-1 border-t border-border/50 dark:border-[#4a5568] bg-muted/30 dark:bg-[#3e4451]/30">
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.max(0, prev - 1)); }}
              disabled={currentPage === 0}
              className="flex items-center justify-center w-6 h-6 rounded hover:bg-muted dark:hover:bg-[#4a5568] disabled:opacity-30 disabled:cursor-not-allowed dark:text-[#9cdcfe] transition-colors"
              title="Previous"
            >
              <ChevronLeft size={14} />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setCurrentPage(idx); }}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentPage
                      ? 'bg-primary dark:bg-[#4fc3f7] w-3'
                      : 'bg-muted-foreground/40 dark:bg-[#828997] hover:bg-muted-foreground/60 dark:hover:bg-[#9cdcfe]'
                  }`}
                  title={`Page ${idx + 1}`}
                />
              ))}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.min(totalPages - 1, prev + 1)); }}
              disabled={currentPage === totalPages - 1}
              className="flex items-center justify-center w-6 h-6 rounded hover:bg-muted dark:hover:bg-[#4a5568] disabled:opacity-30 disabled:cursor-not-allowed dark:text-[#9cdcfe] transition-colors"
              title="Next"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

"use client"

import * as React from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  GripVertical,
  Edit,
  Folder,
  FolderOpen,
  FolderKanban,
  FolderSync,
  FolderSearch,
  FolderTree,
  FolderX,
  FolderCheck,
  FolderLock,
  FolderHeart,
  FolderKey,
  FolderCog,
  FolderArchive,
  FolderGit,
  Star,
  Heart,
  Zap,
  Rocket,
  Lightbulb,
  Brain,
  Code,
  Database,
  Globe,
  Mail,
  Users,
  Home,
  Coffee,
  Camera,
  Music,
  Palette,
  Award,
  Trophy,
  Crown,
  Gem,
  Sparkles,
  Sun,
  Moon,
  Cloud,
  Leaf,
  Flower2,
  Bug,
  Bird,
  Cat,
  Dog,
  Car,
  Plane,
  Ship,
  Train,
  Bike,
  Compass,
  MapPin,
  Navigation,
  Tags,
  Hash,
  Activity,
  TrendingUp,
  BarChart,
  LineChart,
  Notebook,
  FileText,
  Image,
  Video,
  Archive,
  Briefcase,
  Calendar,
  Clock,
  Target,
  Shield,
  Key,
  Lock,
  Unlock,
  Wrench,
  Hammer,
  Scissors,
  PenTool,
  Brush,
  Gamepad2,
  Headphones,
  Mic,
  Film,
  ShoppingBag,
  CreditCard,
  Building,
  Footprints,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { useSelectedNote } from "@/components/notes/selected-note-context"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { getFolders, getNotes, setFolders, setNotes, deleteFolder, deleteNote, updateFolder, reorderFolders, reorderNotes, moveNoteToFolder } from "@/services/localstorage"
function SidebarLoader(){
  return (
    <div className="py-4 flex items-center justify-center">
      <div className="h-5 w-5 rounded-full border-2 border-muted border-t-transparent animate-spin" aria-label="Loading" />
    </div>
  );
}

const dummy = {
  user: {
    name: "coding Agent",
    email: "Hi there",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "coding",
      logo: GalleryVerticalEnd,
      plan: "AI Notetaker",
    },
  ],
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
}

const data = {
  user: {
    name: "coding Agent",
    email: "Hi there",
    avatar: "https://github.com/shadcn.png",
  },
  teams: [
    {
      name: "coding",
      logo: Command,
      plan: "AI Notetaker",
    },
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [folders, setFoldersState] = React.useState<any[]>([]);
  const [notes, setNotesState] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { selectedNoteId, setSelectedNoteId } = useSelectedNote();
  const [addMode, setAddMode] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState("");
  const [addingNoteForFolderId, setAddingNoteForFolderId] = React.useState<string | null>(null);
  const [newNoteTitle, setNewNoteTitle] = React.useState("");
  const [pickingFolderId, setPickingFolderId] = React.useState<string | null>(null);
  const [pickingPosition, setPickingPosition] = React.useState<{ x: number; y: number } | null>(null);
  const [editingFolderId, setEditingFolderId] = React.useState<string | null>(null);
  const [editFolderName, setEditFolderName] = React.useState("");
  const [editMode, setEditMode] = React.useState<boolean>(false);

  const lucideIcons = [
    AudioWaveform,
    BookOpen,
    Bot,
    Command,
    Frame,
    GalleryVerticalEnd,
    Map,
    PieChart,
    Settings2,
    SquareTerminal,
    Folder,
    FolderOpen,
    Star,
    Heart,
    Zap,
    Rocket,
    Lightbulb,
    Brain,
    Code,
    Globe,
  ];

  const hashString = (value: string) => {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  const iconKeyToComponent: Record<string, any> = {
    AudioWaveform,
    BookOpen,
    Bot,
    Command,
    Frame,
    GalleryVerticalEnd,
    Map,
    PieChart,
    Settings2,
    SquareTerminal,
    Folder,
    FolderOpen,
    FolderKanban,
    FolderSync,
    FolderSearch,
    FolderTree,
    FolderX,
    FolderCheck,
    FolderLock,
    FolderHeart,
    FolderKey,
    FolderCog,
    FolderArchive,
    FolderGit,
    Star,
    Heart,
    Zap,
    Rocket,
    Lightbulb,
    Brain,
    Code,
    Database,
    Globe,
    Mail,
    Users,
    Home,
    Coffee,
    Camera,
    Music,
    Palette,
    Award,
    Trophy,
    Crown,
    Gem,
    Sparkles,
    Sun,
    Moon,
    Cloud,
    Leaf,
    Flower2,
    Bug,
    Bird,
    Cat,
    Dog,
    Car,
    Plane,
    Ship,
    Train,
    Bike,
    Compass,
    MapPin,
    Navigation,
    Tags,
    Hash,
    Activity,
    TrendingUp,
    BarChart,
    LineChart,
    Notebook,
    FileText,
    Image,
    Video,
    Archive,
    Briefcase,
    Calendar,
    Clock,
    Target,
    Shield,
    Key,
    Lock,
    Unlock,
    Wrench,
    Hammer,
    Scissors,
    PenTool,
    Brush,
    Gamepad2,
    Headphones,
    Mic,
    Film,
    ShoppingBag,
    CreditCard,
    Building,
    Footprints,
  };

  const iconOptions = Object.keys(iconKeyToComponent).map((key) => ({ key, Icon: iconKeyToComponent[key] }));

  const getIconForId = (id: string, iconKey?: string | null) => {
    if (iconKey && iconKeyToComponent[iconKey]) return iconKeyToComponent[iconKey];
    if (lucideIcons.length === 0) return GalleryVerticalEnd;
    const idx = hashString(String(id)) % lucideIcons.length;
    return lucideIcons[idx];
  };

  React.useEffect(() => {
    const foldersData = getFolders();
    const notesData = getNotes();
    setFoldersState(foldersData);
    setNotesState(notesData);
    setLoading(false);
    const onNotes = () => setNotesState(getNotes());
    const onFolders = () => setFoldersState(getFolders());
    if (typeof window !== "undefined") {
      window.addEventListener("nimble:notes-changed", onNotes as any);
      window.addEventListener("nimble:folders-changed", onFolders as any);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("nimble:notes-changed", onNotes as any);
        window.removeEventListener("nimble:folders-changed", onFolders as any);
      }
    };
  }, []);

  const getRandomIcon = () => {
    if (lucideIcons.length === 0) return GalleryVerticalEnd;
    const idx = Math.floor(Math.random() * lucideIcons.length);
    return lucideIcons[idx];
  };

  const navMainItems = React.useMemo(() => {
    const items = folders.map((folder: any) => {
      const childNotes = notes.filter((n: any) => n.folderId === folder.id);
      return {
        id: String(folder.id),
      title: folder.name ?? "Untitled",
        icon: getIconForId(String(folder.id), folder.iconKey ?? undefined),
        isActive: childNotes.length > 0,
        items: childNotes.map((note: any) => ({
          id: String(note.id),
        title: note.title ?? "Untitled",
        })),
      };
    });
    const uncategorized = notes.filter((n: any) => !n.folderId || !folders.some((f: any) => f.id === n.folderId));
    if (uncategorized.length > 0) {
      items.push({
        id: "",
        title: "Uncategorized",
        icon: getIconForId("uncategorized"),
        isActive: uncategorized.length > 0,
        items: uncategorized.map((note: any) => ({ id: String(note.id), title: note.title ?? "Untitled" })),
      });
    }
    return items;
  }, [folders, notes]);

  const handleAddNote = (folderId: string | null) => {
    const targetFolderId = folderId === "" ? null : folderId;
    const proposedName = newNoteTitle.trim();
    const title = proposedName || "Untitled";
    const now = new Date().toISOString();
    const newNote = {
      id: String(Date.now()),
      title,
      content: "",
      folderId: targetFolderId,
      createdAt: now,
      updatedAt: now,
      tags: [] as string[],
    };
    const next = [...notes, newNote];
    setNotes(next);
    setNotesState(next);
    setSelectedNoteId(String(newNote.id));
    setAddingNoteForFolderId(null);
    setNewNoteTitle("");
  };

  const handleStartAddNote = (folderId: string | null) => {
    setAddingNoteForFolderId(folderId);
    setNewNoteTitle("");
  };

  const handleConfirmAddNote = () => {
    handleAddNote(addingNoteForFolderId);
  };

  const handleCancelAddNote = () => {
    setAddingNoteForFolderId(null);
    setNewNoteTitle("");
  };

  const handleDeleteFolder = (folderId: string) => {
    const folder = folders.find((f: any) => String(f.id) === String(folderId));
    const name = folder?.name || "this folder";
    if (!window.confirm(`Delete "${name}" and all its notes? This cannot be undone.`)) return;
    deleteFolder(folderId);
    setFoldersState(getFolders());
    setNotesState(getNotes());
  };

  const handleStartPickIcon = (folderId: string, pos: { x: number; y: number }) => {
    setPickingFolderId(folderId);
    setPickingPosition(pos);
  };

  const handlePickIcon = (folderId: string, key: string) => {
    const next = folders.map((f: any) => (String(f.id) === String(folderId) ? { ...f, iconKey: key } : f));
    setFolders(next);
    setFoldersState(next);
    setPickingFolderId(null);
    setPickingPosition(null);
  };

  const handleCancelPick = () => {
    setPickingFolderId(null);
    setPickingPosition(null);
  };

  const handleDeleteNote = (noteId: string) => {
    const note = notes.find((n: any) => String(n.id) === String(noteId));
    const title = note?.title || "this note";
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    deleteNote(noteId);
    const next = getNotes();
    setNotesState(next);
    if (String(selectedNoteId) === String(noteId)) {
      setSelectedNoteId(null);
    }
  };

  const handleStartAdd = () => {
    setAddMode(true);
    setNewFolderName("");
  };

  const handleConfirmAdd = () => {
    const name = newFolderName.trim();
    if (!name) return;
    const newFolder = {
      id: String(Date.now()),
      name,
      color: null,
      createdAt: new Date().toISOString(),
    };
    const next = [...folders, newFolder];
    setFolders(next);
    setFoldersState(next);
    setAddMode(false);
    setNewFolderName("");
  };

  const handleCancelAdd = () => {
    setAddMode(false);
    setNewFolderName("");
  };

  const handleStartEditFolder = (folderId: string) => {
    const folder = folders.find((f: any) => String(f.id) === String(folderId));
    setEditingFolderId(folderId);
    setEditFolderName(folder?.name || "");
  };

  const handleConfirmEditFolder = () => {
    if (!editingFolderId) return;
    const name = editFolderName.trim();
    if (!name) {
      handleCancelEditFolder();
      return;
    }
    const folder = folders.find((f: any) => String(f.id) === String(editingFolderId));
    if (!folder) return;
    const updated = { ...folder, name };
    updateFolder(String(editingFolderId), updated);
    setFoldersState(getFolders());
    setEditingFolderId(null);
    setEditFolderName("");
  };

  const handleCancelEditFolder = () => {
    setEditingFolderId(null);
    setEditFolderName("");
  };

  const handleReorderFolders = (folderIds: string[]) => {
    reorderFolders(folderIds);
    setFoldersState(getFolders());
  };

  const handleReorderNotes = (noteIds: string[], folderId: string | null) => {
    reorderNotes(noteIds, folderId);
    setNotesState(getNotes());
  };

  const handleMoveNote = (noteId: string, targetFolderId: string | null) => {
    moveNoteToFolder(noteId, targetFolderId);
    setNotesState(getNotes());
  };


  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent className="[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {loading ? (
          <SidebarLoader />
        ) : (
        <NavMain
          items={navMainItems}
          onSelectNote={(id) => setSelectedNoteId(id)}
          selectedNoteId={selectedNoteId}
          onDeleteFolder={handleDeleteFolder}
          onStartEditFolder={handleStartEditFolder}
          editingFolderId={editingFolderId}
          editFolderName={editFolderName}
          onChangeEditFolderName={setEditFolderName}
          onConfirmEditFolder={handleConfirmEditFolder}
          onCancelEditFolder={handleCancelEditFolder}
          onStartPickIcon={handleStartPickIcon}
          pickingFolderId={pickingFolderId}
          pickingPosition={pickingPosition}
          iconOptions={iconOptions}
          onPickIcon={handlePickIcon}
          onCancelPick={handleCancelPick}
          onAddNote={handleAddNote}
          addingNoteForFolderId={addingNoteForFolderId}
          newNoteTitle={newNoteTitle}
          onStartAddNote={handleStartAddNote}
          onChangeNewNoteTitle={setNewNoteTitle}
          onConfirmAddNote={handleConfirmAddNote}
          onCancelAddNote={handleCancelAddNote}
          onDeleteNote={handleDeleteNote}
          addMode={addMode}
          newFolderName={newFolderName}
          onStartAdd={handleStartAdd}
          onChangeNewName={setNewFolderName}
          onConfirmAdd={handleConfirmAdd}
          onCancelAdd={handleCancelAdd}
          editMode={editMode}
          onToggleEditMode={() => setEditMode(!editMode)}
          onReorderFolders={handleReorderFolders}
          onReorderNotes={handleReorderNotes}
          onMoveNote={handleMoveNote}
        />
        )}
        {/* <NavProjects projects={dummy.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}


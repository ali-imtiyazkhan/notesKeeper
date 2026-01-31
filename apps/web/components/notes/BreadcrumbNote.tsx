"use client"

import * as React from "react";
import { ChevronRight, Folder as FolderIcon, FileText } from "lucide-react";
import { useSelectedNote } from "@/components/notes/selected-note-context";
import { getNotes, getFolders } from "@/services/localstorage";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function BreadcrumbNote() {
    const { selectedNoteId } = useSelectedNote();
    const [noteTitle, setNoteTitle] = React.useState<string>("");
    const [folderName, setFolderName] = React.useState<string>("");

    const refresh = React.useCallback(() => {
        const notes = getNotes();
        const folders = getFolders();
        const note = notes.find(n => String(n.id) === String(selectedNoteId));
        setNoteTitle(note?.title ?? "Select a note");
        const folder = folders.find(f => String(f.id) === String(note?.folderId));
        setFolderName(folder?.name ?? (note ? "Uncategorized" : ""));
    }, [selectedNoteId]);

    React.useEffect(() => {
        refresh();
        const onNotes = () => refresh();
        if (typeof window !== "undefined") {
            window.addEventListener("nimble:notes-changed", onNotes as any);
        }
        return () => {
            if (typeof window !== "undefined") {
                window.removeEventListener("nimble:notes-changed", onNotes as any);
            }
        };
    }, [refresh]);

    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem className="hidden md:flex items-center gap-1 text-muted-foreground dark:text-[#9cdcfe]">
                    <FolderIcon size={14} className="dark:text-[#9cdcfe]" />
                    <BreadcrumbLink href="#" className="dark:hover:text-[#4fc3f7]">Notes</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block dark:text-[#4a5568]">
                    <ChevronRight size={12} />
                </BreadcrumbSeparator>
                {folderName ? (
                    <BreadcrumbItem className="hidden md:flex items-center gap-1">
                        <BreadcrumbLink href="#" className="dark:text-[#9cdcfe] dark:hover:text-[#4fc3f7]">{folderName}</BreadcrumbLink>
                    </BreadcrumbItem>
                ) : null}
                {folderName ? (
                    <BreadcrumbSeparator className="hidden md:block dark:text-[#4a5568]">
                        <ChevronRight size={12} />
                    </BreadcrumbSeparator>
                ) : null}
                <BreadcrumbItem className="flex items-center gap-1">
                    <FileText size={14} className="dark:text-[#9cdcfe]" />
                    <BreadcrumbPage className="dark:text-[#d4d4d4]">{noteTitle || "Select a note"}</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
    );
}



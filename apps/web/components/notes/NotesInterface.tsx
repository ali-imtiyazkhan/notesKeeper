"use client"

import { useSelectedNote } from "@/components/notes/selected-note-context";
import { getNotes, updateNote } from "@/services/localstorage";
import * as React from "react";
import { Sparkles } from "lucide-react";

export default function NotesInterface(){
	const { selectedNoteId } = useSelectedNote();
	const [allNotes, setAllNotes] = React.useState<ReturnType<typeof getNotes>>([]);
	
	const selected = React.useMemo(() => {
		const notes = getNotes();
		return notes.find(n => String(n.id) === String(selectedNoteId));
	}, [selectedNoteId, allNotes]);

	const [title, setTitle] = React.useState<string>("");
	const [content, setContent] = React.useState<string>("");

	React.useEffect(() => {
		const notes = getNotes();
		setAllNotes(notes);
		const note = notes.find(n => String(n.id) === String(selectedNoteId));
		if (note) {
			setTitle(note.title ?? "");
			setContent(note.content ?? "");
		} else {
			setTitle("");
			setContent("");
		}
	}, [selectedNoteId]);

	React.useEffect(() => {
		const handleNotesChanged = () => {
			const notes = getNotes();
			setAllNotes(notes);
			const note = notes.find(n => String(n.id) === String(selectedNoteId));
			if (note) {
				setTitle(note.title ?? "");
				setContent(note.content ?? "");
			}
		};
		if (typeof window !== "undefined") {
			window.addEventListener("nimble:notes-changed", handleNotesChanged);
			return () => {
				window.removeEventListener("nimble:notes-changed", handleNotesChanged);
			};
		}
	}, [selectedNoteId]);

	React.useEffect(() => {
		if (!selected || !selectedNoteId) return;
		const handle = setTimeout(() => {
			const currentNote = getNotes().find(n => String(n.id) === String(selectedNoteId));
			if (!currentNote) return;
			const updated = {
				...currentNote,
				title,
				content,
				updatedAt: new Date().toISOString(),
			};
			updateNote(String(selectedNoteId), updated);
			try { window.dispatchEvent(new CustomEvent("nimble:notes-changed")); } catch {}
		}, 500);
		return () => clearTimeout(handle);
	}, [title, content, selectedNoteId, selected]);

	const handleSummarize = () => {
		if (!selectedNoteId || !content.trim()) return;
		const prompt = `Please provide a concise summary of the following note content. Keep it brief but comprehensive:\n\n${content}`;
		window.dispatchEvent(new CustomEvent("nimble:ai-query", { detail: { prompt } }));
	};

	if (!selectedNoteId || !selected) {
		return (
			<div className="font-sans h-full flex items-center justify-center p-4 text-xs md:text-sm text-muted-foreground dark:text-[#9cdcfe] text-center">
				Select a note from the sidebar to view and edit.
			</div>
		);
	}

	return (
		<div className="font-sans h-full flex flex-col p-3 md:p-6">
			<div className="flex items-center gap-2 mb-3 md:mb-4 flex-shrink-0">
				<input
					className="flex-1 bg-transparent text-xl md:text-2xl font-semibold outline-none placeholder:text-neutral-400 dark:placeholder:text-[#828997] dark:text-[#d4d4d4]"
					placeholder="Untitled"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
				/>
				{content && content.trim() && (
					<button
						onClick={handleSummarize}
						className="inline-flex items-center gap-1 md:gap-1.5 rounded-md border border-border/60 dark:border-[#4a5568] bg-secondary/50 dark:bg-[#3e4451] px-1.5 md:px-2 py-0.5 md:py-1 text-[10px] md:text-[11px] font-medium transition-all hover:bg-secondary dark:hover:bg-[#4a5568] hover:border-border dark:hover:border-[#4fc3f7] active:scale-95 dark:text-[#9cdcfe] dark:hover:text-[#4fc3f7] shrink-0"
						title="Summarize note"
					>
						<Sparkles className="h-2.5 w-2.5 md:h-3 md:w-3" />
						<span className="hidden sm:inline">Summarize</span>
					</button>
				)}
			</div>
			<textarea
				className="w-full flex-1 bg-transparent outline-none resize-none text-xs md:text-sm whitespace-pre-wrap overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden placeholder:text-neutral-400 dark:placeholder:text-[#828997] dark:text-[#d4d4d4]"
				placeholder="Start writing..."
				value={content}
				onChange={(e) => setContent(e.target.value)}
			/>
		</div>
	)
}
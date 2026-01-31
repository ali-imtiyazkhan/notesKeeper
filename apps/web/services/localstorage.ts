import { Folder, Note } from "./types"

export const FOLDERS_KEY = "folders";
export const NOTES_KEY = "notes";

function safeParse<T>(raw: any, fallback: T): T {
	try {
		const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
		return (Array.isArray(parsed) ? parsed : fallback) as T;
	} catch {
		return fallback;
	}
}

const read = (key: string): string | null => {
	if (typeof window === "undefined") {
		return null;
	}
	try {
		return localStorage.getItem(key);
	} catch (err) {
		console.error("localStorage.getItem failed:", err);
		return null;
	}
};

const write = (key: string, value: string): void => {
	if (typeof window === "undefined") {
		return;
	}
	try {
		localStorage.setItem(key, value);
	} catch (err) {
		console.error("localStorage.setItem failed:", err);
	}
};

const getFolders = (): Folder[] => {
	if (typeof window === "undefined") {
		return [];
	}
	const folders = safeParse<Folder[]>(localStorage.getItem(FOLDERS_KEY), []);
	return folders.sort((a, b) => {
		const orderA = a.order ?? Infinity;
		const orderB = b.order ?? Infinity;
		return orderA - orderB;
	});
}

const setFolders = (folders: Folder[]): void => {
	if (typeof window === "undefined") {
		return;
	}
	localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    try {
        window.dispatchEvent(new CustomEvent("nimble:folders-changed"));
    } catch {}
}

const getNotes = (): Note[] => {
	if (typeof window === "undefined") {
		return [];
	}
	const notes = safeParse<Note[]>(localStorage.getItem(NOTES_KEY), []);
	return notes.sort((a, b) => {
		const orderA = a.order ?? Infinity;
		const orderB = b.order ?? Infinity;
		return orderA - orderB;
	});
};
  
const setNotes = (notes: Note[]): void => {
	if (typeof window === "undefined") {
		return;
	}
	localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    try {
        window.dispatchEvent(new CustomEvent("nimble:notes-changed"));
    } catch {}
};

const fallback = ({ folders = [], notes = [] }: { folders?: Folder[]; notes?: Note[] } = {}): void => {
	if (typeof window === "undefined") return;
	if (!localStorage.getItem(FOLDERS_KEY)) setFolders(folders);
	if (!localStorage.getItem(NOTES_KEY)) setNotes(notes);
};

const upsertFolder = (folder: Folder): void => {
	const folders = getFolders();
	const idx = folders.findIndex(f => f.id === folder.id);
	if (idx === -1) {
		folders.push(folder);
	} else {
		folders[idx] = folder;
	}
	setFolders(folders);
};

const updateFolder = (id: string, updatedFolder: Folder): void => {
	const folders = getFolders().map(f => (f.id === id ? updatedFolder : f));
	setFolders(folders);
};

const deleteFolder = (id: string): void => {
    setFolders(getFolders().filter(f => f.id !== id));
    const remaining = getNotes().filter(n => n.folderId !== id);
    setNotes(remaining);
};

const upsertNote = (note: Note): void => {
	const notes = getNotes();
	const idx = notes.findIndex(n => n.id === note.id);
	if (idx === -1) {
		notes.push(note);
	} else {
		notes[idx] = note;
	}
	setNotes(notes);
};

const updateNote = (id: string, updatedNote: Note): void => {
	const updated = getNotes().map(n => (n.id === id ? updatedNote : n));
	setNotes(updated);
};

const deleteNote = (id: string): void => {
	setNotes(getNotes().filter(n => n.id !== id));
};

const getNotesByFolder = (folderId: string | null): Note[] => {
	return getNotes().filter(n => n.folderId === folderId);
};

const reorderFolders = (folderIds: string[]): void => {
	const folders = getFolders();
	const reordered = folderIds.map((id, index) => {
		const folder = folders.find(f => f.id === id);
		if (!folder) return null;
		return { ...folder, order: index } as Folder;
	}).filter((f): f is Folder => f !== null);
	
	const existingIds = new Set(folderIds);
	folders.forEach(folder => {
		if (!existingIds.has(folder.id)) {
			reordered.push(folder);
		}
	});
	
	setFolders(reordered);
};

const reorderNotes = (noteIds: string[], folderId: string | null): void => {
	const notes = getNotes();
	const reordered = noteIds.map((id, index) => {
		const note = notes.find(n => n.id === id);
		if (!note) return null;
		return { ...note, order: index, folderId } as Note;
	}).filter((n): n is Note => n !== null);
	
	reordered.forEach(note => {
		upsertNote(note);
	});
	
	notes.forEach(note => {
		if (note.folderId === folderId && !noteIds.includes(note.id)) {
			if (note.order === undefined) {
				upsertNote({ ...note, order: 9999 });
			}
		}
	});
};

const moveNoteToFolder = (noteId: string, targetFolderId: string | null): void => {
	const notes = getNotes();
	const note = notes.find(n => n.id === noteId);
	if (!note) return;
	
	const targetFolderNotes = notes.filter(n => n.folderId === targetFolderId);
	const newOrder = targetFolderNotes.length;
	
	upsertNote({ ...note, folderId: targetFolderId, order: newOrder });
};

export {
	read,
	write,
	getFolders,
	setFolders,
	getNotes,
	setNotes,
	fallback,
	upsertFolder,
	updateFolder,
	deleteFolder,
	upsertNote,
	updateNote,
	deleteNote,
	getNotesByFolder,
	reorderFolders,
	reorderNotes,
	moveNoteToFolder,
};
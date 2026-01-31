"use client"

import * as React from "react";

type SelectedNoteContextValue = {
	selectedNoteId: string | null;
	setSelectedNoteId: (id: string | null) => void;
};

const SelectedNoteContext = React.createContext<SelectedNoteContextValue | undefined>(undefined);

export function SelectedNoteProvider({ children }: { children: React.ReactNode }) {
	const [selectedNoteId, setSelectedNoteId] = React.useState<string | null>(null);
	const value = React.useMemo(() => ({ selectedNoteId, setSelectedNoteId }), [selectedNoteId]);
	return <SelectedNoteContext.Provider value={value}>{children}</SelectedNoteContext.Provider>;
}

export function useSelectedNote(): SelectedNoteContextValue {
	const ctx = React.useContext(SelectedNoteContext);
	if (!ctx) {
		throw new Error("useSelectedNote must be used within SelectedNoteProvider");
	}
	return ctx;
}



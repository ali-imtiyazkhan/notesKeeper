type Folder = {
    id: string;
    name: string;
    color?: string | null;
    iconKey?: string | null;
    createdAt: string;
    order?: number;
};

type Note = {
    id: string;
    title: string;
    content: string;
    folderId: string | null;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    order?: number;
}

export { Folder, Note };
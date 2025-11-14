export type ListVisibility = "public" | "unlisted" | "private";

export type CollaboratorRole = "editor" | "viewer";

export type ViewerRole = "owner" | CollaboratorRole;

export type ListSummary = {
  id: string;
  title: string;
  description: string | null;
  visibility: ListVisibility;
  isCollaborative: boolean;
  updatedAt: string;
  itemCount: number;
  collaboratorCount: number;
  viewerRole: ViewerRole;
};

export type ListCollaborator = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  role: CollaboratorRole;
};

export type ListItem = {
  id: string;
  position: number;
  note: string | null;
  book: {
    id: string;
    title: string;
    author: string;
    coverUrl: string | null;
    averageRating: number | null;
  };
};

export type ListDetail = {
  id: string;
  title: string;
  description: string | null;
  visibility: ListVisibility;
  isCollaborative: boolean;
  owner: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  collaborators: ListCollaborator[];
  viewerRole: ViewerRole;
  items: ListItem[];
  updatedAt: string;
};

export type AvailableBook = {
  id: string;
  title: string;
  author: string;
};


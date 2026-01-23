"use client";

import Image from "next/image";

import type { ListCollaborator } from "@/features/lists/types";

type CollaboratorsStackProps = {
  owner: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  collaborators: ListCollaborator[];
};

const buildInitials = (displayName: string) => {
  const segments = displayName.trim().split(" ").filter(Boolean);

  if (segments.length === 0) {
    return "BK";
  }

  if (segments.length === 1) {
    return segments[0]!.slice(0, 2).toUpperCase();
  }

  return `${segments[0]!.slice(0, 1)}${segments[segments.length - 1]!.slice(0, 1)}`.toUpperCase();
};

const CollaboratorsStack = ({ owner, collaborators }: CollaboratorsStackProps) => {
  const people = [
    { id: owner.id, displayName: owner.displayName, avatarUrl: owner.avatarUrl, role: "Propriétaire" },
    ...collaborators.map((person) => ({
      id: person.userId,
      displayName: person.displayName,
      avatarUrl: person.avatarUrl,
      role: person.role === "editor" ? "Éditeur·rice" : "Lecteur·rice",
    })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex -space-x-3">
        {people.slice(0, 5).map((person) => (
          <div
            key={person.id}
            className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-background bg-muted"
            title={`${person.displayName} • ${person.role}`}
          >
            {person.avatarUrl ? (
              <Image
                src={person.avatarUrl}
                alt={person.displayName}
                fill
                className="object-cover"
                sizes="40px"
                unoptimized
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-foreground">
                {buildInitials(person.displayName)}
              </span>
            )}
          </div>
        ))}
      </div>
      {people.length > 5 ? (
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          +{people.length - 5} autres
        </span>
      ) : null}
    </div>
  );
};

export default CollaboratorsStack;


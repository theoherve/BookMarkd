"use client";

import { useState } from "react";
import { Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import ProfileEditModal from "@/components/profile/profile-edit-modal";

type ProfileEditButtonProps = {
  initialDisplayName: string;
  initialBio: string | null;
  initialAvatarUrl: string | null;
  avatarInitials: string;
};

const ProfileEditButton = ({
  initialDisplayName,
  initialBio,
  initialAvatarUrl,
  avatarInitials,
}: ProfileEditButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        aria-label="Modifier mon profil"
        title="Modifier mon profil"
        className="sm:size-auto sm:px-3 sm:py-2"
      >
        <Settings className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only">Modifier mon profil</span>
      </Button>
      <ProfileEditModal
        initialDisplayName={initialDisplayName}
        initialBio={initialBio}
        initialAvatarUrl={initialAvatarUrl}
        avatarInitials={avatarInitials}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  );
};

export default ProfileEditButton;


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
        onClick={() => setIsOpen(true)}
        aria-label="Modifier mon profil"
      >
        <Settings className="h-4 w-4" />
        Modifier mon profil
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


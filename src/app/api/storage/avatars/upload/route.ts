import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { resolveSessionUserId } from "@/lib/auth/user";
import { uploadAvatar } from "@/lib/storage/storage";
import db from "@/lib/supabase/db";

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getCurrentSession();
    const userId = await resolveSessionUserId(session);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Récupérer les données du formulaire
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "file is required" },
        { status: 400 },
      );
    }

    // Valider le type de fichier
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
        { status: 400 },
      );
    }

    // Valider la taille du fichier (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 },
      );
    }

    // Déterminer l'extension
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const validExtensions = ["jpg", "jpeg", "png", "webp"];
    const finalExtension = validExtensions.includes(extension) ? extension : "jpg";

    // Uploader l'avatar
    const result = await uploadAvatar(userId, file, finalExtension);

    if (!result) {
      return NextResponse.json(
        { error: "Failed to upload avatar" },
        { status: 500 },
      );
    }

    // Mettre à jour la base de données avec l'URL de l'avatar
    const { error: updateError } = await db.client
      .from("users")
      .update({ avatar_url: result.publicUrl })
      .eq("id", userId);

    if (updateError) {
      console.error("[storage] Error updating user avatar_url:", updateError);
      // Ne pas retourner d'erreur car l'upload a réussi
    }

    return NextResponse.json({
      success: true,
      url: result.publicUrl,
      path: result.path,
    });
  } catch (error) {
    console.error("[storage] Error uploading avatar:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

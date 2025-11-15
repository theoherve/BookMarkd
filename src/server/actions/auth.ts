"use server";

import bcrypt from "bcryptjs";
import db from "@/lib/supabase/db";

type RegisterInput = {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
};

type RegisterResult =
  | { success: true }
  | { success: false; message: string };

const emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (value: string) => {
  return value.trim().toLowerCase();
};

export const registerUser = async (
  input: RegisterInput,
): Promise<RegisterResult> => {
  try {
    const email = normalizeEmail(input.email);
    const displayName = input.displayName.trim();

    if (!emailRegex.test(email)) {
      return { success: false, message: "Adresse e-mail invalide." };
    }

    if (displayName.length < 2) {
      return {
        success: false,
        message: "Merci de saisir un nom affiché d’au moins 2 caractères.",
      };
    }

    if (input.password.length < 8) {
      return {
        success: false,
        message: "Le mot de passe doit contenir au moins 8 caractères.",
      };
    }

    if (input.password !== input.confirmPassword) {
      return {
        success: false,
        message: "La confirmation du mot de passe ne correspond pas.",
      };
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    // Générer un username unique à partir de l'email
    const generateUsername = (email: string, displayName: string): string => {
      const base = displayName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 20) || email.split("@")[0]?.slice(0, 20) || "user";
      
      return base;
    };

    let username = generateUsername(email, displayName);
    let usernameAttempts = 0;
    const maxAttempts = 10;

    // Vérifier l'unicité du username et ajouter un suffixe si nécessaire
    while (usernameAttempts < maxAttempts) {
      const { data: existingUsername, error: usernameError } = await db.client
        .from("users")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      if (usernameError) {
        throw usernameError;
      }

      if (!existingUsername) {
        break;
      }

      username = `${generateUsername(email, displayName)}${usernameAttempts + 1}`;
      usernameAttempts++;
    }

    console.log("[auth] registerUser: Attempting to insert user", { email, displayName, username });

    // Vérifier si l'utilisateur existe déjà
    const { data: existingUser, error: existingErr } = await db.client
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existingErr) {
      throw existingErr;
    }

    if (existingUser) {
      return {
        success: false,
        message:
          "Un compte existe déjà avec cette adresse e-mail. Connectez-vous ou réinitialisez votre mot de passe.",
      };
    }

    const { data: inserted, error: insertError } = await db.client
      .from("users")
      .insert([
        {
          email,
          username,
          display_name: displayName,
          password_hash: passwordHash,
        },
      ])
      .select("id")
      .single();

    if (insertError) {
      // Contrainte unique
      if ((insertError as any).code === "23505") {
        return {
          success: false,
          message: "Un compte existe déjà avec cette adresse e-mail.",
        };
      }
      throw insertError;
    }

    console.log("[auth] registerUser: User created successfully with Supabase", {
      userId: inserted?.id,
    });
    return { success: true };
  } catch (error) {
    console.error("[auth] registerUser error:", error);
    
    // Retourner un message plus spécifique si possible
    if (error && typeof error === "object" && "message" in error) {
      const errorMessage = (error as { message?: string }).message;
      if (errorMessage?.includes("permission") || errorMessage?.includes("policy")) {
        return {
          success: false,
          message: "Erreur de permissions. Vérifiez que les policies RLS sont correctement configurées.",
        };
      }
    }
    
    return {
      success: false,
      message:
        "Impossible de créer le compte pour le moment. Merci de réessayer plus tard.",
    };
  }
};


"use server";

import bcrypt from "bcryptjs";

import { createSupabaseServiceClient } from "@/lib/supabase/service-client";

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

    const supabase = createSupabaseServiceClient();

    const { data: existingUser, error: existingError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingUser?.id) {
      return {
        success: false,
        message:
          "Un compte existe déjà avec cette adresse e-mail. Connectez-vous ou réinitialisez votre mot de passe.",
      };
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const { error: insertError } = await supabase.from("users").insert({
      email,
      display_name: displayName,
      password_hash: passwordHash,
    });

    if (insertError) {
      throw insertError;
    }

    return { success: true };
  } catch (error) {
    console.error("[auth] registerUser error:", error);
    return {
      success: false,
      message:
        "Impossible de créer le compte pour le moment. Merci de réessayer plus tard.",
    };
  }
};


"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma/client";

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

    console.log("[auth] registerUser: Attempting to insert user", { email, displayName });

    // Utiliser Prisma pour contourner les problèmes de RLS
    // Vérifier si l'utilisateur existe déjà avec Prisma
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return {
        success: false,
        message:
          "Un compte existe déjà avec cette adresse e-mail. Connectez-vous ou réinitialisez votre mot de passe.",
      };
    }

    try {
      const newUser = await prisma.user.create({
        data: {
          email,
          displayName,
          passwordHash,
        },
      });

      console.log("[auth] registerUser: User created successfully with Prisma", { userId: newUser.id });
      return { success: true };
    } catch (prismaError: unknown) {
      console.error("[auth] registerUser Prisma error:", prismaError);
      
      // Gérer les erreurs Prisma spécifiques
      if (prismaError && typeof prismaError === "object" && "code" in prismaError) {
        const error = prismaError as { code?: string; message?: string };
        
        // Erreur de contrainte unique (email déjà existant)
        if (error.code === "P2002") {
          return {
            success: false,
            message: "Un compte existe déjà avec cette adresse e-mail.",
          };
        }
        
        // Erreur de validation
        if (error.code === "P2003") {
          return {
            success: false,
            message: "Erreur de validation des données.",
          };
        }
      }
      
      // Si c'est une erreur Prisma, la relancer pour qu'elle soit catchée par le catch général
      throw prismaError;
    }
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


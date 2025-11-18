"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { registerUser } from "@/server/actions/auth";

const SignUpForm = () => {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await registerUser({
        displayName,
        email,
        password,
        confirmPassword,
      });
      if (result.success) {
        setFeedback(
          "Compte créé avec succès. Vous allez être redirigé vers la page de connexion.",
        );
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        setFeedback(result.message);
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-3xl border border-border bg-card/60 p-4 sm:p-8 shadow-sm backdrop-blur"
    >
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-foreground">
          Créez votre compte
        </h1>
        <p className="text-sm text-muted-foreground">
          Rejoignez la communauté BookMarkd et suivez vos lectures en équipe.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Nom affiché</Label>
          <Input
            id="displayName"
            name="displayName"
            placeholder="Camille"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            autoComplete="name"
            required
            className="min-h-[48px] sm:min-h-0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="camille@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            className="min-h-[48px] sm:min-h-0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
            className="min-h-[48px] sm:min-h-0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            required
            className="min-h-[48px] sm:min-h-0"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full min-h-[48px] sm:min-h-0"
      >
        {isPending ? "Création..." : "Créer mon compte"}
      </Button>
      {feedback ? (
        <p className="text-xs text-muted-foreground text-center">{feedback}</p>
      ) : null}
      <p className="text-xs text-muted-foreground text-center">
        Déjà un compte ?{" "}
        <Button variant="link" className="h-auto p-0 text-xs" asChild>
          <a href="/login">Se connecter</a>
        </Button>
      </p>
    </form>
  );
};

export default SignUpForm;


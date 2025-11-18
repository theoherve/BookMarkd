"use client";

import { useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginFormProps = {
  callbackUrl?: string | null;
};

const LoginForm = ({ callbackUrl }: LoginFormProps) => {
  const searchParams = useSearchParams();
  const safeCallbackUrl = useMemo(() => {
    // Priorité au prop callbackUrl, puis aux searchParams, puis "/"
    const urlFromProp = callbackUrl && typeof callbackUrl === "string" ? callbackUrl : null;
    const urlFromParams = searchParams.get("callbackUrl");
    const finalUrl = urlFromProp ?? urlFromParams ?? "/";

    return finalUrl.startsWith("/") ? finalUrl : "/";
  }, [callbackUrl, searchParams]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      setErrorMessage("Merci de renseigner votre email et votre mot de passe.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const response = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: safeCallbackUrl,
    });

    if (response?.error) {
      setErrorMessage("Identifiants invalides. Veuillez réessayer.");
      setIsSubmitting(false);
      return;
    }

    // Utiliser window.location.href pour forcer un rechargement complet
    // et garantir que la session est disponible côté serveur
    window.location.href = safeCallbackUrl;
  };

  const errorFromParams = searchParams.get("error");
  const displayError =
    errorMessage ??
    (errorFromParams === "CredentialsSignin"
      ? "Identifiants invalides. Veuillez réessayer."
      : null);

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-border bg-card/70 p-4 sm:p-8 shadow-sm backdrop-blur"
    >
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-foreground">
          Connectez-vous
        </h1>
        <p className="text-sm text-muted-foreground">
          Rejoignez votre club de lecture BookMarkd.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="camille@example.com"
            value={email}
            onChange={handleEmailChange}
            autoComplete="email"
            required
            className="min-h-[48px] sm:min-h-0"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-sm font-medium text-foreground"
          >
            Mot de passe
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={handlePasswordChange}
            autoComplete="current-password"
            required
            className="min-h-[48px] sm:min-h-0"
          />
        </div>
      </div>

      {displayError ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive"
        >
          {displayError}
        </p>
      ) : null}

      <Button
        type="submit"
        className="w-full"
        aria-label="Se connecter à BookMarkd"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Connexion..." : "Se connecter"}
      </Button>

      <div className="space-y-1 text-xs text-muted-foreground">
        <p>Démo :</p>
        <p>
          <span className="font-medium">Email :</span> camille@example.com
        </p>
        <p>
          <span className="font-medium">Mot de passe :</span> bookmarkd123
        </p>
      </div>
    </form>
  );
};

export default LoginForm;


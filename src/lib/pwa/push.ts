// Web Push - Structure de base (optionnel)
// Nécessite VAPID keys et configuration serveur complète

export const subscribeToPush = async (): Promise<PushSubscription | null> => {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    console.warn("Web Push n'est pas supporté dans cet environnement");
    return null;
  }

  if (!process.env.NEXT_PUBLIC_ENABLE_PUSH || process.env.NEXT_PUBLIC_ENABLE_PUSH !== "true") {
    console.warn("Web Push est désactivé");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        ? urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
        : undefined,
    });

    return subscription;
  } catch (error) {
    console.error("Erreur lors de l'abonnement aux notifications push:", error);
    return null;
  }
};

const urlBase64ToUint8Array = (base64String: string): BufferSource => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
};


import { NextRequest, NextResponse } from "next/server";

// Route placeholder pour l'abonnement Web Push
// Nécessite configuration VAPID complète et intégration Supabase/backend

export async function POST(request: NextRequest) {
  try {
    if (process.env.NEXT_PUBLIC_ENABLE_PUSH !== "true") {
      return NextResponse.json(
        { success: false, message: "Web Push est désactivé" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const subscription = body.subscription as PushSubscription;

    if (!subscription) {
      return NextResponse.json(
        { success: false, message: "Subscription manquante" },
        { status: 400 },
      );
    }

    // TODO: Enregistrer la subscription dans Supabase/DB
    // Exemple:
    // await db.client.from('push_subscriptions').insert({
    //   user_id: userId,
    //   subscription: JSON.stringify(subscription),
    //   created_at: new Date().toISOString(),
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[pwa] push subscribe error:", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors de l'abonnement" },
      { status: 500 },
    );
  }
}


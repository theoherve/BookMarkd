import { NextRequest, NextResponse } from "next/server";
import { trackPageView } from "@/lib/analytics/track-page-view";

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { path, referrer, sessionId } = body as {
      path?: string;
      referrer?: string;
      sessionId?: string;
    };

    if (!path || typeof path !== "string") {
      return NextResponse.json({ error: "path is required" }, { status: 400 });
    }

    void trackPageView({
      path,
      referrer: referrer || undefined,
      sessionId: sessionId || undefined,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
};

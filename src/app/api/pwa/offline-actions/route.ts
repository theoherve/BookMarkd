import { NextRequest, NextResponse } from "next/server";

import { likeReview, unlikeReview } from "@/server/actions/review";
import { updateReadingStatus, rateBook, createReview } from "@/server/actions/book";
import { requestFollow, unfollowUser } from "@/server/actions/follow";
import type { OfflineActionPayload } from "@/types/offline-actions";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as OfflineActionPayload;

    let result;

    switch (body.type) {
      case "likeReview":
        result = await likeReview(body.reviewId);
        break;
      case "unlikeReview":
        result = await unlikeReview(body.reviewId);
        break;
      case "updateReadingStatus":
        result = await updateReadingStatus(body.bookId, body.status);
        break;
      case "rateBook":
        result = await rateBook(body.bookId, body.rating);
        break;
      case "createReview":
        result = await createReview({
          bookId: body.bookId,
          visibility: body.visibility,
          title: body.title,
          content: body.content,
          spoiler: body.spoiler,
        });
        break;
      case "requestFollow":
        result = await requestFollow(body.targetUserId);
        break;
      case "unfollowUser":
        result = await unfollowUser(body.targetUserId);
        break;
      default:
        return NextResponse.json(
          { success: false, message: "Type d'action non reconnu" },
          { status: 400 },
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[pwa] offline-actions error:", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors de l'exécution de l'action" },
      { status: 500 },
    );
  }
}


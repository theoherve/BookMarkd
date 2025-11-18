export type OfflineActionType =
  | "likeReview"
  | "unlikeReview"
  | "updateReadingStatus"
  | "rateBook"
  | "createReview"
  | "requestFollow"
  | "unfollowUser";

export type OfflineActionPayload =
  | { type: "likeReview"; reviewId: string }
  | { type: "unlikeReview"; reviewId: string }
  | { type: "updateReadingStatus"; bookId: string; status: "to_read" | "reading" | "finished" }
  | { type: "rateBook"; bookId: string; rating: number }
  | {
      type: "createReview";
      bookId: string;
      visibility: "public" | "friends" | "private";
      title?: string;
      content: string;
      spoiler?: boolean;
    }
  | { type: "requestFollow"; targetUserId: string }
  | { type: "unfollowUser"; targetUserId: string };

export type OfflineAction = {
  id: string;
  type: OfflineActionType;
  payload: OfflineActionPayload;
  createdAt: number;
  retries: number;
  lastError?: string;
};


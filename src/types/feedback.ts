export type FeedbackType = "bug" | "suggestion";

export type FeedbackStatus = "pending" | "reviewed" | "resolved" | "rejected";

export type BrowserInfo = {
  userAgent: string;
  platform: string;
  language: string;
  url?: string;
  screenWidth?: number;
  screenHeight?: number;
  timezone?: string;
};

export type CreateFeedbackInput = {
  type: FeedbackType;
  title: string;
  description: string;
  browserInfo?: BrowserInfo;
  url?: string;
};

export type Feedback = {
  id: string;
  userId: string;
  type: FeedbackType;
  title: string;
  description: string;
  browserInfo: BrowserInfo | null;
  url: string | null;
  status: FeedbackStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type Stage = {
  id: string;
  title: string;
  guidingQuestion: string;
  hint?: string;
};

export type Case = {
  id: string;
  title: string;
  source?: string;
  fullText: string;
  /** Instructor-only: the analytical framework/theory this case is meant to teach.
   *  Included in every stage's system prompt (not shown to students) so the model's
   *  guidance stays grounded in the same lens throughout. */
  framework?: string;
  stages: Stage[];
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

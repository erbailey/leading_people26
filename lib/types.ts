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
  stages: Stage[];
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

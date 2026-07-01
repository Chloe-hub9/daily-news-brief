export interface BriefingResponse {
  date: string;
  markdown: string;
  cached: boolean;
  generatedAt: string;
}

export interface BriefingErrorResponse {
  error: string;
  message: string;
}

export interface GenerateBriefingInput {
  date: string;
  force: boolean;
}

export interface SalaoConfig {
  id: number;
  google_review_url: string | null;
}

export interface SalaoConfigPayload {
  google_review_url?: string | null;
}

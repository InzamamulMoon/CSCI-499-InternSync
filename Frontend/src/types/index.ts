export interface UserProfile {
  languages: string[];
  courses: string[];
  interests: string[];
  unique_background: string;
}

export interface InternshipMatch {
  company: string;
  role: string;
  location: string;
  score: number;
  application_links: string[];
  /** From README (e.g. Summer 2026, Fall 2026, Off-season terms) */
  terms?: string;
  /** Listing freshness from repo (e.g. "1d ago", "1mo ago") */
  age?: string;
  /** Tech/stack hints parsed from title + company (backend heuristics) */
  listing_tags?: string[];
  explanation: {
    suggestion: string;
    matched_skills: string[];
  };
}

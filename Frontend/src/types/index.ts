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
  explanation: {
    suggestion: string;
    matched_skills: string[];
  };
}

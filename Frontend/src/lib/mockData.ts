import type { InternshipMatch, UserProfile } from "../types";

export const mockProfile: UserProfile = {
  languages: ["TypeScript", "Python", "Rust", "SQL"],
  courses: [
    "CSCI 335: Software Engineering",
    "CSCI 340: Machine Learning",
    "CSCI 316: Computer Networks",
  ],
  interests: ["distributed systems", "NLP", "open source", "developer tooling"],
  unique_background:
    "Maintained a campus hackathon check-in app used by 800+ students; shipped a Chrome extension that summarizes GitHub PRs with a small ONNX model; TA for data structures and ran weekly Leetcode workshops for first-gen CS majors.",
};

export const mockInternships: InternshipMatch[] = [
  {
    company: "Google",
    role: "Software Engineering Intern, Core Infrastructure",
    location: "Mountain View, CA (hybrid)",
    score: 95,
    application_links: [
      "https://careers.google.com/students/",
      "https://buildyourfuture.withgoogle.com/internships/",
    ],
    explanation: {
      suggestion:
        "Strong alignment with backend and systems coursework plus demonstrated shipping experience. Highlight your TA leadership and the ONNX side project when discussing model deployment constraints.",
      matched_skills: [
        "Python",
        "distributed systems",
        "software engineering",
        "SQL",
        "open source",
      ],
    },
  },
  {
    company: "Netflix",
    role: "Summer Intern, ML Platform",
    location: "Los Gatos, CA",
    score: 82,
    application_links: [
      "https://jobs.netflix.com/",
      "https://jobs.netflix.com/search?q=intern",
    ],
    explanation: {
      suggestion:
        "ML course and NLP interest map well to platform work; deepen your story around data pipelines and reliability (SLOs, batch vs. streaming) to close the gap with senior teams.",
      matched_skills: [
        "Machine Learning",
        "Python",
        "NLP",
        "SQL",
        "software engineering",
      ],
    },
  },
  {
    company: "Helio Labs (NYC startup)",
    role: "Full-Stack Intern — Internship Matching Product",
    location: "Brooklyn, NY",
    score: 76,
    application_links: [
      "https://heliolabs.example/jobs/eng-intern-2026",
      "mailto:talent@heliolabs.example?subject=Full-Stack%20Intern%20Application",
    ],
    explanation: {
      suggestion:
        "Startup fit is high: you have end-to-end shipping experience and community-facing work. Emphasize TypeScript/React velocity and willingness to own ambiguous roadmap slices.",
      matched_skills: [
        "TypeScript",
        "software engineering",
        "open source",
        "developer tooling",
      ],
    },
  },
  {
    company: "Riverstone FinTech",
    role: "Backend Intern, Payments Risk",
    location: "Remote (US)",
    score: 58,
    application_links: ["https://riverstone.example/careers/interns"],
    explanation: {
      suggestion:
        "Networks and SQL help, but listings stress Java/Kotlin and regulatory knowledge. Add a small project touching fraud heuristics or event-driven ingestion to improve embedding similarity.",
      matched_skills: ["SQL", "Computer Networks", "Python"],
    },
  },
  {
    company: "Northwind Analytics",
    role: "Data Engineering Intern",
    location: "Chicago, IL",
    score: 45,
    application_links: [
      "https://northwind.example/university-program",
      "https://northwind.example/apply/data-intern",
    ],
    explanation: {
      suggestion:
        "Overlap is mostly SQL and Python; role leans Spark/Airflow-heavy stacks. Consider a two-week portfolio piece: ETL from a public API into a warehouse with tests and a simple dashboard.",
      matched_skills: ["Python", "SQL"],
    },
  },
];


export interface ResumeAnalysis {
  candidateSummary: {
    name: string;
    experienceLevel: 'Fresher' | 'Junior' | 'Mid' | 'Senior';
    primarySkills: string[];
    industry: string;
  };
  strengths: {
    skills: string[];
    highlights: string[];
  };
  weaknesses: {
    missingSections: string[];
    issues: string[];
    skillGaps: string[];
  };
  atsCompatibility: {
    score: number;
    optimizationLevel: string;
    formattingIssues: string[];
  };
  jobMatch?: {
    matchPercentage: number;
    missingKeywords: string[];
    suggestions: string[];
  };
  suggestions: {
    skills: string[];
    formatting: string[];
    projects: string[];
  };
  finalScore: {
    score: number;
    explanation: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  parts: { text: string }[];
}

export interface MarketInsight {
  title: string;
  description: string;
  sourceUrl: string;
}

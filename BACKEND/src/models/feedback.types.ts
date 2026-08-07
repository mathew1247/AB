export interface InterviewFeedback {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  strengths: string[];
  weaknesses: string[];
  topicScores: Record<string, number>;
  recommendations: string[];
  summary: string;
}

export type ProfileMode = 'normal' | 'dyslexia' | 'adhd';

export interface SimplifiedContent {
  summary: string;
  chunks: string[];
  keywords: string[];
  bulletPoints: string[];
}

export interface FocusNudge {
  message: string;
  action: string;
}

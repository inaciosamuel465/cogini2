
export type EnglishLevel = 'Iniciante' | 'Básico' | 'Intermediário' | 'Avançado' | 'Executivo';

export interface Phrase {
  id: string;
  moduleId: string;
  level: EnglishLevel;
  type: 'word' | 'sentence'; // Mandatory: word vs sentence
  portuguese: string;
  english: string;
  context?: string;
  audio_url?: string;
  order: number;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export enum ProcessingStage {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export type AnalysisLanguage = 'pt-BR' | 'en-US' | 'es-ES';

export interface AnalysisResult {
  transcription: string;
  translation: string;
  language: string;
  sentiment: 'Positivo' | 'Neutro' | 'Negativo' | 'Misto' | string;
  tone: string;
  keywords: string[];
  summary: {
    executive: string;
    bulletPoints: string[];
    detailed: string;
    insights: string[];
    risksAndOpportunities: string[];
    technicalObservations: string;
    actionPlan: string[];
  };
  segments: Array<{
    timestamp: string;
    text: string;
  }>;
  groundingMetadata?: { // Novo: Metadados de busca
    searchQueries: string[];
    webSources: Array<{ title: string; url: string }>;
  };
}

export interface ProcessingState {
  stage: ProcessingStage;
  progress: number;
  message: string;
  error?: string;
}

export type InputType = 'file' | 'link' | 'live';
export type AnalysisMode = 'concise' | 'detailed';
export type IndustryContext = 'general' | 'legal' | 'financial' | 'medical' | 'technical' | 'marketing' | 'meeting';

export type AnalysisCategory = 'transcription' | 'investigation' | 'visual' | 'meeting_minutes';

export interface UploadedFile {
  file: File | null;
  url: string | null;
  type: 'audio' | 'video' | 'image';
  name: string;
  analysisMode?: AnalysisMode;
  analysisCategory?: AnalysisCategory;
  targetLanguage?: AnalysisLanguage;
  useGrounding?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'admin' | 'user';
  createdAt: any;
  preferredName?: string;
  learningFocus?: string;
  greetingStyle?: string;
  totalXP?: number;
  streakCount?: number;
  badges?: string[];
}

export interface UserProgress {
  userId: string;
  level: string;
  area: string;
  completedPhrases: string[];
  completedScenarios: string[];
  stats: {
    totalAttempts: number;
    correctAttempts: number;
    errors: number;
  };
  totalXP: number;
  streakCount: number;
  badges: string[];
  lastActive: any;
}

export interface HistoryItem { // Novo: Item de histórico
  id: string;
  userId: string;
  fileName: string;
  fileType: 'audio' | 'video';
  date: any; // Firestore Timestamp
  result: AnalysisResult;
  tags: string[];
}

export interface SystemSettings {
  // Brand & Style
  themeColor: 'blue' | 'emerald' | 'purple' | 'orange' | 'indigo' | 'rose' | 'amber';
  uiDensity: 'compact' | 'comfortable';
  animationsEnabled: boolean;
  particleOpacity: number; // 0-1

  // AI Params
  globalModel: string;
  temperature: number; // 0.1 - 1.0
  voiceTone: 'professional' | 'energetic' | 'calm' | 'authoritative';
  aiMaxTokens: number;
  aiSystemContext?: string;
  geminiApiKey?: string;

  // Modules Management
  enabledModules: {
    analyze: boolean;
    enterprise: boolean;
    sjl: boolean;
    translator: boolean;
    liveAssistant: boolean;
    history: boolean;
  };

  // SJL Specific (Instructor)
  sjl: {
    instructorName: string;
    welcomeMessage: string;
    repetitionCount: number;
    correctionCriteria: 'standard' | 'strict' | 'loose';
  };
}

// ============================================================
// SJL DUOLINGO MODE — Tipos de Exercício e Progresso
// ============================================================

export type DuoExerciseType = 'translation' | 'multiple_choice' | 'fill_in_blank' | 'listen_and_type' | 'speak';

export interface DuoExerciseBase {
  id: string;
  phraseRef?: string; // Reference to original Phrase ID
  phraseType?: 'word' | 'sentence'; // Discriminator for distractors
  type: DuoExerciseType; // Ex: 'translation', 'multiple_choice'
  xpValue: number;
  context?: string;
  audioUrl?: string;
}

export interface DuoTranslationExercise extends DuoExerciseBase {
  type: 'translation';
  direction: 'en_to_pt' | 'pt_to_en';
  phrase: string;
  wordBank: string[];
  correctAnswer: string;
  hint?: string;
}

export interface DuoMultipleChoiceExercise extends DuoExerciseBase {
  type: 'multiple_choice';
  question: string;
  options: string[];
  correct: string;
  explanation: string;
  hint?: string;
}

export interface DuoFillInBlankExercise extends DuoExerciseBase {
  type: 'fill_in_blank';
  sentence: string; // usa ___ como placeholder
  correctAnswer: string;
  options?: string[];
  context?: string;
  hint?: string;
}

export interface DuoListenAndTypeExercise extends DuoExerciseBase {
  type: 'listen_and_type';
  audioText: string; // texto que seria falado
  correctAnswer: string;
  hint?: string;
}

export interface DuoSpeakExercise extends DuoExerciseBase {
  type: 'speak';
  phraseToSpeak: string;
  translation?: string;
  correctAnswer: string;
  hint?: string;
}

export type DuoExercise =
  | DuoTranslationExercise
  | DuoMultipleChoiceExercise
  | DuoFillInBlankExercise
  | DuoListenAndTypeExercise
  | DuoSpeakExercise;

export interface DuoLesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  order: number;
  exercises: DuoExercise[];
}

export interface DuoModule {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji
  color: string; // classe CSS de cor
  order: number;
  lessons: DuoLesson[];
}

export interface DuoUserProgress {
  userId?: string;
  currentModuleId: string;
  currentLessonId: string;
  exerciseIndex: number;
  totalXP: number;
  streakDays: number;
  lastSessionDate: string; // ISO date string YYYY-MM-DD
  completedLessons: string[]; // lesson IDs
  wordsMastered: string[];
  wordsInReview: string[];
  statistics: {
    totalExercises: number;
    correctAnswers: number;
    totalSessions: number;
  };
}

export const DEFAULT_DUO_PROGRESS: DuoUserProgress = {
  currentModuleId: 'mod1',
  currentLessonId: 'mod1_les1',
  exerciseIndex: 0,
  totalXP: 0,
  streakDays: 0,
  lastSessionDate: '',
  completedLessons: [],
  wordsMastered: [],
  wordsInReview: [],
  statistics: {
    totalExercises: 0,
    correctAnswers: 0,
    totalSessions: 0,
  },
};

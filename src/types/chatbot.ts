import type { Child } from "@/types/child";

// Interface pour un choix individuel proposé par le chatbot
export interface ChatbotChoice {
  id: string;
  label: string;
  value: string;
  icon?: string; // Nom d'icône Lucide optionnel (Moon, Brain, Heart, Sparkles, etc.)
}

export interface ChatbotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  // Propriétés pour les choix interactifs
  choices?: ChatbotChoice[];
  choiceType?: 'single' | 'multiple';
  selectedChoices?: string[]; // IDs des choix sélectionnés
  choicesConfirmed?: boolean; // true après confirmation par l'utilisateur
}

export interface ChatbotChildInfo {
  id: string;
  name: string;
  gender: string;
  birthDate: string;
  age: number;
  interests?: string[];
  teddyName?: string;
  imaginaryWorld?: string;
}

export interface ChatbotInitPayload {
  chatInput: string;
  sessionId: string;
  userId: string;
  action: 'init';
  children: ChatbotChildInfo[];
}

export interface ChatbotMessagePayload {
  chatInput: string;
  sessionId: string;
  userId: string;
  action: 'message';
}

export type ChatbotPayload = ChatbotInitPayload | ChatbotMessagePayload;

export interface ChatbotResponse {
  type: 'message' | 'message_with_choices' | 'story_complete' | 'error';
  content: string;
  choices?: ChatbotChoice[]; // Présent quand type === 'message_with_choices'
  choiceType?: 'single' | 'multiple'; // Type de sélection
  storyId?: string; // Présent quand type === 'story_complete'
}

export type CreationMode = 'guided' | 'chat';

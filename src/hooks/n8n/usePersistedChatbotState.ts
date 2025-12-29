import { useState, useEffect, useCallback, useRef } from 'react';
import { safeStorage } from '@/utils/safeStorage';
import type { ChatbotMessage } from '@/types/chatbot';

interface PersistedChatbotState {
  conversationId: string;
  messages: SerializedMessage[];
  isInitialized: boolean;
  storyId: string | null;
  childrenIds: string[];
  timestamp: number;
}

// Messages sérialisés (Date → string)
interface SerializedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const STORAGE_KEY = 'calmiverse_chatbot_session';
const EXPIRATION_TIME = 60 * 60 * 1000; // 1 heure

const generateId = () => crypto.randomUUID();

const serializeMessages = (messages: ChatbotMessage[]): SerializedMessage[] => {
  return messages.map(msg => ({
    ...msg,
    timestamp: msg.timestamp.toISOString()
  }));
};

const deserializeMessages = (messages: SerializedMessage[]): ChatbotMessage[] => {
  return messages.map(msg => ({
    ...msg,
    timestamp: new Date(msg.timestamp)
  }));
};

const getDefaultState = (): PersistedChatbotState => ({
  conversationId: generateId(),
  messages: [],
  isInitialized: false,
  storyId: null,
  childrenIds: [],
  timestamp: Date.now()
});

/**
 * Hook pour persister l'état du chatbot dans localStorage.
 * Conserve la conversation même si l'utilisateur change d'application.
 */
export const usePersistedChatbotState = () => {
  const [state, setState] = useState<PersistedChatbotState>(() => {
    try {
      const stored = safeStorage.getItem(STORAGE_KEY);
      if (stored && stored.trim()) {
        const parsed = JSON.parse(stored) as PersistedChatbotState;
        
        if (parsed && typeof parsed === 'object' && parsed.timestamp) {
          // Vérifier l'expiration
          if (Date.now() - parsed.timestamp < EXPIRATION_TIME) {
            console.log('[usePersistedChatbotState] Session restaurée:', {
              conversationId: parsed.conversationId,
              messagesCount: parsed.messages?.length || 0,
              isInitialized: parsed.isInitialized,
              age: Math.round((Date.now() - parsed.timestamp) / 1000 / 60) + 'min'
            });
            return {
              ...parsed,
              messages: Array.isArray(parsed.messages) ? parsed.messages : [],
              childrenIds: Array.isArray(parsed.childrenIds) ? parsed.childrenIds : []
            };
          } else {
            console.log('[usePersistedChatbotState] Session expirée, nettoyage');
            safeStorage.removeItem(STORAGE_KEY);
          }
        }
      }
    } catch (error) {
      console.warn('[usePersistedChatbotState] Erreur restauration:', error);
      safeStorage.removeItem(STORAGE_KEY);
    }
    
    return getDefaultState();
  });

  // Ref pour éviter les sauvegardes inutiles
  const lastSavedRef = useRef<string>('');

  // Sauvegarde automatique quand l'état change
  useEffect(() => {
    const stateToSave = { ...state, timestamp: Date.now() };
    const serialized = JSON.stringify(stateToSave);
    
    // Éviter les sauvegardes identiques
    if (serialized === lastSavedRef.current) return;
    
    try {
      safeStorage.setItem(STORAGE_KEY, serialized);
      lastSavedRef.current = serialized;
      console.log('[usePersistedChatbotState] Session sauvegardée:', {
        conversationId: state.conversationId,
        messagesCount: state.messages.length
      });
    } catch (error) {
      console.warn('[usePersistedChatbotState] Erreur sauvegarde:', error);
    }
  }, [state]);

  // Forcer la sauvegarde immédiate (pour visibilitychange)
  const forceSave = useCallback(() => {
    const stateToSave = { ...state, timestamp: Date.now() };
    try {
      safeStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      console.log('[usePersistedChatbotState] Sauvegarde forcée');
    } catch (error) {
      console.warn('[usePersistedChatbotState] Erreur sauvegarde forcée:', error);
    }
  }, [state]);

  // Actions de mise à jour
  const setMessages = useCallback((messages: ChatbotMessage[]) => {
    setState(prev => ({
      ...prev,
      messages: serializeMessages(messages)
    }));
  }, []);

  const addMessage = useCallback((message: ChatbotMessage) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, {
        ...message,
        timestamp: message.timestamp.toISOString()
      }]
    }));
  }, []);

  const setInitialized = useCallback((initialized: boolean) => {
    setState(prev => ({ ...prev, isInitialized: initialized }));
  }, []);

  const setStoryId = useCallback((storyId: string | null) => {
    setState(prev => ({ ...prev, storyId }));
  }, []);

  const setChildrenIds = useCallback((childrenIds: string[]) => {
    setState(prev => ({ ...prev, childrenIds }));
  }, []);

  const resetSession = useCallback(() => {
    console.log('[usePersistedChatbotState] Reset session');
    safeStorage.removeItem(STORAGE_KEY);
    lastSavedRef.current = '';
    setState(getDefaultState());
  }, []);

  const hasValidSession = useCallback(() => {
    const isValid = state.isInitialized && 
                    state.messages.length > 0 &&
                    Date.now() - state.timestamp < EXPIRATION_TIME;
    return isValid;
  }, [state]);

  return {
    // État
    conversationId: state.conversationId,
    messages: deserializeMessages(state.messages),
    isInitialized: state.isInitialized,
    storyId: state.storyId,
    childrenIds: state.childrenIds,
    
    // Actions
    setMessages,
    addMessage,
    setInitialized,
    setStoryId,
    setChildrenIds,
    resetSession,
    forceSave,
    hasValidSession
  };
};

export default usePersistedChatbotState;

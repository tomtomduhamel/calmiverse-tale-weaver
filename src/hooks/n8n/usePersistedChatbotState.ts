import { useState, useEffect, useCallback, useRef } from 'react';
import { safeStorage } from '@/utils/safeStorage';
import type { ChatbotMessage, ChatbotChoice } from '@/types/chatbot';

interface PersistedChatbotState {
  conversationId: string;
  messages: SerializedMessage[];
  isInitialized: boolean;
  storyId: string | null;
  childrenIds: string[];
  timestamp: number;
  pendingMessageId: string | null;
  pendingMessageTimestamp: number | null;
}

// Messages sérialisés (Date → string, avec champs choix)
interface SerializedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  choices?: ChatbotChoice[];
  choiceType?: 'single' | 'multiple';
  selectedChoices?: string[];
  choicesConfirmed?: boolean;
}

const STORAGE_KEY = 'calmiverse_chatbot_session';
const EXPIRATION_TIME = 60 * 60 * 1000; // 1 heure

const generateId = () => crypto.randomUUID();

const serializeMessages = (messages: ChatbotMessage[]): SerializedMessage[] => {
  return messages.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp.toISOString(),
    choices: msg.choices,
    choiceType: msg.choiceType,
    selectedChoices: msg.selectedChoices,
    choicesConfirmed: msg.choicesConfirmed,
  }));
};

const deserializeMessages = (messages: SerializedMessage[]): ChatbotMessage[] => {
  return messages.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: new Date(msg.timestamp),
    choices: msg.choices,
    choiceType: msg.choiceType,
    selectedChoices: msg.selectedChoices,
    choicesConfirmed: msg.choicesConfirmed,
  }));
};

const getDefaultState = (): PersistedChatbotState => ({
  conversationId: generateId(),
  messages: [],
  isInitialized: false,
  storyId: null,
  childrenIds: [],
  timestamp: Date.now(),
  pendingMessageId: null,
  pendingMessageTimestamp: null
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
        id: message.id,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp.toISOString(),
        choices: message.choices,
        choiceType: message.choiceType,
        selectedChoices: message.selectedChoices,
        choicesConfirmed: message.choicesConfirmed,
      }]
    }));
  }, []);

  // Mettre à jour un message existant (pour les choix)
  const updateMessage = useCallback((messageId: string, updates: Partial<ChatbotMessage>) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg =>
        msg.id === messageId
          ? {
              ...msg,
              ...updates,
              // Garder le timestamp en string
              timestamp: updates.timestamp 
                ? updates.timestamp.toISOString() 
                : msg.timestamp
            }
          : msg
      )
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

  // Mettre à jour le conversationId si n8n renvoie un ID différent
  const setConversationId = useCallback((newId: string) => {
    setState(prev => {
      if (prev.conversationId !== newId) {
        console.log('[usePersistedChatbotState] ConversationId mis à jour:', prev.conversationId, '->', newId);
        return { ...prev, conversationId: newId };
      }
      return prev;
    });
  }, []);

  const setPendingMessage = useCallback((messageId: string | null) => {
    setState(prev => ({
      ...prev,
      pendingMessageId: messageId,
      pendingMessageTimestamp: messageId ? Date.now() : null
    }));
  }, []);

  const clearPendingMessage = useCallback(() => {
    setState(prev => ({
      ...prev,
      pendingMessageId: null,
      pendingMessageTimestamp: null
    }));
  }, []);

  const hasPendingMessage = useCallback(() => {
    if (!state.pendingMessageId || !state.pendingMessageTimestamp) return false;
    // Message en attente depuis moins de 5 minutes
    const PENDING_TIMEOUT = 5 * 60 * 1000;
    return Date.now() - state.pendingMessageTimestamp < PENDING_TIMEOUT;
  }, [state.pendingMessageId, state.pendingMessageTimestamp]);

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
    pendingMessageId: state.pendingMessageId,
    
    // Actions
    setMessages,
    addMessage,
    updateMessage,
    setInitialized,
    setStoryId,
    setChildrenIds,
    setConversationId,
    setPendingMessage,
    clearPendingMessage,
    hasPendingMessage,
    resetSession,
    forceSave,
    hasValidSession
  };
};

export default usePersistedChatbotState;

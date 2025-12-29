import { useState, useCallback, useRef } from 'react';
import type { Child } from '@/types/child';
import type { 
  ChatbotMessage, 
  ChatbotResponse, 
  ChatbotInitPayload, 
  ChatbotMessagePayload,
  ChatbotChildInfo 
} from '@/types/chatbot';
import { calculateAge } from '@/utils/age';
import { usePersistedChatbotState } from './usePersistedChatbotState';
import { usePageVisibility } from '@/hooks/usePageVisibility';

const N8N_WEBHOOK_URL = 'https://n8n.srv856374.hstgr.cloud/webhook/ec1e6586-86dc-4755-b73e-80a19762ddd2';

const generateId = () => crypto.randomUUID();

const mapChildToInfo = (child: Child): ChatbotChildInfo => ({
  id: child.id,
  name: child.name,
  gender: child.gender,
  birthDate: child.birthDate.toISOString(),
  age: calculateAge(child.birthDate),
  interests: child.interests,
  teddyName: child.teddyName,
  imaginaryWorld: child.imaginaryWorld,
});

export const useN8nChatbotStory = () => {
  // État persisté
  const {
    conversationId,
    messages,
    isInitialized,
    storyId,
    setMessages,
    addMessage: addPersistedMessage,
    setInitialized,
    setStoryId: setPersistedStoryId,
    setChildrenIds,
    resetSession,
    forceSave,
    hasValidSession
  } = usePersistedChatbotState();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Verrou synchrone pour empêcher les appels multiples à initConversation
  const isInitializingRef = useRef(false);

  // Sauvegarder quand la page devient invisible
  usePageVisibility({
    onHide: forceSave,
    onShow: () => {
      console.log('[useN8nChatbotStory] Page visible - session valide:', hasValidSession());
    }
  });

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const newMessage: ChatbotMessage = {
      id: generateId(),
      role,
      content,
      timestamp: new Date(),
    };
    addPersistedMessage(newMessage);
    return newMessage;
  }, [addPersistedMessage]);

  const handleResponse = useCallback((response: ChatbotResponse) => {
    console.log('[useN8nChatbotStory] Réponse reçue:', response);

    if (response.type === 'error') {
      setError(response.content);
      addMessage('assistant', response.content);
      return;
    }

    if (response.type === 'story_complete' && response.storyId) {
      console.log('[useN8nChatbotStory] Histoire créée:', response.storyId);
      addMessage('assistant', response.content);
      setPersistedStoryId(response.storyId);
      return;
    }

    // Message normal
    addMessage('assistant', response.content);
  }, [addMessage, setPersistedStoryId]);

  const sendToWebhook = useCallback(async (payload: ChatbotInitPayload | ChatbotMessagePayload): Promise<ChatbotResponse> => {
    console.log('[useN8nChatbotStory] Envoi vers n8n:', payload);

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    console.log('[useN8nChatbotStory] Réponse brute n8n:', data);

    // n8n peut renvoyer "chatInput" au lieu de "content"
    const content = data.content || data.chatInput;

    // Si n8n renvoie directement le bon format
    if (data.type && content) {
      return {
        type: data.type,
        content,
        storyId: data.storyId,
      } as ChatbotResponse;
    }

    // Fallback si format différent
    return {
      type: 'message',
      content: typeof data === 'string' ? data : (content || JSON.stringify(data)),
    };
  }, []);

  const initConversation = useCallback(async (userId: string, children: Child[]) => {
    // VERROU SYNCHRONE - empêche les appels multiples simultanés
    if (isInitializingRef.current) {
      console.log('[useN8nChatbotStory] Initialisation déjà en cours, skip');
      return;
    }
    
    // Si session déjà valide, ne pas réinitialiser
    if (isInitialized && hasValidSession()) {
      console.log('[useN8nChatbotStory] Session valide existante, skip init');
      return;
    }

    // Poser le verrou AVANT toute opération async
    isInitializingRef.current = true;
    console.log('[useN8nChatbotStory] Initialisation conversation pour', children.length, 'enfants');
    setIsLoading(true);
    setError(null);
    
    // Sauvegarder les IDs des enfants pour la session
    setChildrenIds(children.map(c => c.id));

    try {
      const payload: ChatbotInitPayload = {
        chatInput: "Bonjour ! Je souhaite créer une histoire personnalisée pour mes enfants.",
        sessionId: conversationId,
        userId,
        action: 'init',
        children: children.map(mapChildToInfo),
      };

      const response = await sendToWebhook(payload);
      handleResponse(response);
      setInitialized(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion';
      console.error('[useN8nChatbotStory] Erreur init:', errorMessage);
      setError(errorMessage);
      addMessage('assistant', "Désolé, je n'arrive pas à me connecter. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
      isInitializingRef.current = false;
    }
  }, [isInitialized, hasValidSession, conversationId, sendToWebhook, handleResponse, addMessage, setInitialized, setChildrenIds]);

  const sendMessage = useCallback(async (message: string, userId: string) => {
    if (!message.trim()) return;

    console.log('[useN8nChatbotStory] Envoi message:', message);
    
    // Ajouter le message utilisateur immédiatement
    addMessage('user', message);
    setIsLoading(true);
    setError(null);

    try {
      const payload: ChatbotMessagePayload = {
        chatInput: message,
        sessionId: conversationId,
        userId,
        action: 'message',
      };

      const response = await sendToWebhook(payload);
      handleResponse(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion';
      console.error('[useN8nChatbotStory] Erreur message:', errorMessage);
      setError(errorMessage);
      addMessage('assistant', "Désolé, je n'ai pas pu traiter votre message. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, sendToWebhook, handleResponse, addMessage]);

  const resetConversation = useCallback(() => {
    console.log('[useN8nChatbotStory] Reset conversation');
    resetSession();
    setError(null);
  }, [resetSession]);

  return {
    messages,
    isLoading,
    error,
    storyId,
    isInitialized,
    conversationId,
    hasValidSession,
    initConversation,
    sendMessage,
    resetConversation,
  };
};

export default useN8nChatbotStory;

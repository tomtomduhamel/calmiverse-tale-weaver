import { useState, useCallback, useRef } from 'react';
import type { Child } from '@/types/child';
import type {
  ChatbotMessage,
  ChatbotResponse,
  ChatbotInitPayload,
  ChatbotMessagePayload,
  ChatbotChildInfo,
  ChatbotChoice
} from '@/types/chatbot';
import { calculateAge } from '@/utils/age';
import { usePersistedChatbotState } from './usePersistedChatbotState';
import { usePageVisibility } from '@/hooks/usePageVisibility';

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_CHAT_WEBHOOK_URL || 'https://n8n.srv856374.hstgr.cloud/webhook/ec1e6586-86dc-4755-b73e-80a19762ddd2';

const generateId = () => crypto.randomUUID();

const mapChildToInfo = (child: Child): ChatbotChildInfo => {
  // Sécurisation : birthDate peut être une string (venant de Supabase) ou une Date
  const birthDate = new Date(child.birthDate);
  return {
    id: child.id,
    name: child.name,
    gender: child.gender,
    birthDate: birthDate.toISOString(),
    age: calculateAge(birthDate),
    interests: child.interests,
    teddyName: child.teddyName,
    imaginaryWorld: child.imaginaryWorld,
  };
};

export const useN8nChatbotStory = () => {
  // État persisté
  const {
    conversationId,
    messages,
    isInitialized,
    storyId,
    setMessages,
    addMessage: addPersistedMessage,
    updateMessage,
    setInitialized,
    setStoryId: setPersistedStoryId,
    setChildrenIds,
    setConversationId,
    resetSession,
    forceSave,
    hasValidSession
  } = usePersistedChatbotState();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verrou synchrone pour empêcher les appels multiples à initConversation
  const isInitializingRef = useRef(false);

  // Sauvegarder l'état quand la page devient invisible
  usePageVisibility({
    onHide: forceSave
  });

  // Ajouter un message (avec support des choix)
  const addMessage = useCallback((
    role: 'user' | 'assistant',
    content: string,
    options?: {
      choices?: ChatbotChoice[];
      choiceType?: 'single' | 'multiple';
    }
  ) => {
    const newMessage: ChatbotMessage = {
      id: generateId(),
      role,
      content,
      timestamp: new Date(),
      choices: options?.choices,
      choiceType: options?.choiceType,
      selectedChoices: [],
      choicesConfirmed: false,
    };
    addPersistedMessage(newMessage);
    return newMessage;
  }, [addPersistedMessage]);

  // Traiter les données de réponse n8n
  const handleResponseData = useCallback((data: any) => {
    console.log('[useN8nChatbotStory] Réponse brute n8n:', data);

    // Synchronisation du sessionId avec n8n
    if (data.sessionId && data.sessionId !== conversationId) {
      console.log('[useN8nChatbotStory] Synchronisation sessionId:', conversationId, '->', data.sessionId);
      setConversationId(data.sessionId);
    }

    const content = data.content || data.chatInput;

    if (data.type === 'error') {
      setError(content);
      addMessage('assistant', content);
      return;
    }

    // Gestion de story_complete - histoire générée par n8n
    if (data.type === 'story_complete') {
      console.log('[useN8nChatbotStory] Histoire complète reçue:', {
        title: data.title,
        objective: data.objective,
        childrenNames: data.childrennames,
        nbMots: data.nb_mots
      });

      const successMessage = content || `L'histoire "${data.title}" a été créée avec succès ! Bonne lecture !`;
      addMessage('assistant', successMessage);

      // Si n8n a sauvegardé l'histoire et renvoyé un storyId
      if (data.storyId) {
        setPersistedStoryId(data.storyId);
      }
      return;
    }

    // Message avec choix (détection basée sur la présence de choices, pas sur le type)
    if (data.choices && Array.isArray(data.choices) && data.choices.length > 0) {
      console.log('[useN8nChatbotStory] Message avec choix:', data.choices.length);
      addMessage('assistant', content, {
        choices: data.choices,
        choiceType: data.choiceType || 'single'
      });
      return;
    }

    // Message normal
    addMessage('assistant', content || JSON.stringify(data));
  }, [conversationId, addMessage, setPersistedStoryId, setConversationId]);

  const handleResponse = useCallback((response: ChatbotResponse) => {
    console.log('[useN8nChatbotStory] Réponse reçue:', response);

    // Synchronisation du sessionId avec n8n
    if (response.sessionId && response.sessionId !== conversationId) {
      console.log('[useN8nChatbotStory] Synchronisation sessionId (init):', conversationId, '->', response.sessionId);
      setConversationId(response.sessionId);
    }

    if (response.type === 'error') {
      setError(response.content);
      addMessage('assistant', response.content);
      return;
    }

    // Gestion de story_complete
    if (response.type === 'story_complete') {
      console.log('[useN8nChatbotStory] Histoire complète reçue:', response.title);
      const successMessage = response.content || `L'histoire "${response.title}" a été créée avec succès !`;
      addMessage('assistant', successMessage);
      if (response.storyId) {
        setPersistedStoryId(response.storyId);
      }
      return;
    }

    // Message avec choix (détection basée sur la présence de choices, pas sur le type)
    if (response.choices && Array.isArray(response.choices) && response.choices.length > 0) {
      addMessage('assistant', response.content, {
        choices: response.choices,
        choiceType: response.choiceType || 'single'
      });
      return;
    }

    // Message normal
    addMessage('assistant', response.content);
  }, [conversationId, addMessage, setPersistedStoryId, setConversationId]);

  const sendToWebhook = useCallback(async (payload: ChatbotInitPayload | ChatbotMessagePayload): Promise<ChatbotResponse> => {
    console.log('[useN8nChatbotStory] Envoi vers n8n:', payload);

    // Timeout étendu pour la génération d'histoire (3 minutes)
    const TIMEOUT_MS = 180000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error text');
        throw new Error(`Erreur HTTP: ${response.status} (${errorText.slice(0, 100)})`);
      }

      // Lecture sécurisée du texte brut avant parsing
      const textResponse = await response.text();

      let data: any;
      try {
        data = JSON.parse(textResponse);
      } catch (parseError) {
        console.error('[useN8nChatbotStory] Erreur parsing JSON:', textResponse.slice(0, 200));
        throw new Error("Format de réponse invalide. Le serveur a peut-être renvoyé une erreur.");
      }

      console.log('[useN8nChatbotStory] Réponse n8n:', data);

      // n8n peut renvoyer "chatInput" au lieu de "content"
      const content = data.content || data.chatInput;

      // Si n8n renvoie directement le bon format avec choix
      if (data.type && content) {
        return {
          type: data.type,
          content,
          sessionId: data.sessionId,
          choices: data.choices,
          choiceType: data.choiceType,
          storyId: data.storyId,
          title: data.title,
          objective: data.objective,
          childrennames: data.childrennames,
          childrenids: data.childrenids,
        } as ChatbotResponse;
      }

      // Fallback si format différent
      return {
        type: 'message',
        content: typeof data === 'string' ? data : (content || JSON.stringify(data)),
        sessionId: data.sessionId,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error("La création prend plus de temps que prévu. L'histoire est probablement en cours de finalisation.");
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
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

      // Fetch simple sans AbortController - continue en arrière-plan si l'onglet change
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();

      // Traiter la réponse
      handleResponseData(data);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion';
      console.error('[useN8nChatbotStory] Erreur message:', errorMessage);
      setError(errorMessage);
      addMessage('assistant', "Désolé, je n'ai pas pu traiter votre message. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, addMessage, handleResponseData]);

  // Sélectionner un choix dans un message
  const selectChoice = useCallback((messageId: string, choiceId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || message.choicesConfirmed) return;

    let newSelected: string[];

    if (message.choiceType === 'multiple') {
      // Toggle pour choix multiples
      const currentSelected = message.selectedChoices || [];
      newSelected = currentSelected.includes(choiceId)
        ? currentSelected.filter(id => id !== choiceId)
        : [...currentSelected, choiceId];
    } else {
      // Remplacement pour choix unique
      newSelected = [choiceId];
    }

    updateMessage(messageId, { selectedChoices: newSelected });
  }, [messages, updateMessage]);

  // Confirmer les choix et envoyer comme message utilisateur
  const confirmChoices = useCallback(async (messageId: string, userId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message?.choices || !message.selectedChoices?.length) return;

    // Marquer comme confirmé
    updateMessage(messageId, { choicesConfirmed: true });

    // Construire le texte à envoyer (les labels des choix sélectionnés)
    const selectedLabels = message.choices
      .filter(c => message.selectedChoices?.includes(c.id))
      .map(c => c.label)
      .join(', ');

    // Envoyer comme message utilisateur
    await sendMessage(selectedLabels, userId);
  }, [messages, updateMessage, sendMessage]);

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
    selectChoice,
    confirmChoices,
  };
};

export default useN8nChatbotStory;

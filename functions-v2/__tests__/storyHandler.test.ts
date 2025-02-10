
import { generateStory } from '../src/handlers/storyHandler';
import { generateStoryWithAI } from '../src/services/openaiService';
import * as admin from 'firebase-admin';

jest.mock('../src/services/openaiService');
jest.mock('firebase-admin');

describe('Story Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAuth = {
    uid: 'test-user-id',
  };

  const mockRequest = {
    data: {
      storyId: 'test-story-id',
      objective: 'Test objective',
      childrenNames: ['Test Child'],
    },
    auth: mockAuth,
  };

  it('should generate a story successfully', async () => {
    const mockGeneratedStory = {
      story_text: 'Test story',
      preview: 'Test preview',
      wordCount: 1000,
      retryCount: 0,
    };

    (generateStoryWithAI as jest.Mock).mockResolvedValue(mockGeneratedStory);

    const mockStoryDoc = {
      exists: true,
      data: () => ({
        _version: 1,
      }),
    };

    const mockTransaction = {
      get: jest.fn().mockResolvedValue(mockStoryDoc),
      update: jest.fn(),
    };

    (admin.firestore as jest.Mock)().runTransaction.mockImplementation(
      async (callback) => callback(mockTransaction)
    );

    const result = await generateStory(mockRequest);

    expect(result).toBeDefined();
    expect(result.status).toBe('completed');
    expect(result.story_text).toBe(mockGeneratedStory.story_text);
  });

  it('should handle authentication errors', async () => {
    const unauthenticatedRequest = {
      ...mockRequest,
      auth: null,
    };

    await expect(generateStory(unauthenticatedRequest))
      .rejects
      .toThrow('Utilisateur non authentifié');
  });

  it('should handle invalid parameters', async () => {
    const invalidRequest = {
      ...mockRequest,
      data: {
        storyId: '',
        objective: '',
        childrenNames: [],
      },
      auth: mockAuth,
    };

    await expect(generateStory(invalidRequest))
      .rejects
      .toThrow('Paramètres invalides');
  });
});

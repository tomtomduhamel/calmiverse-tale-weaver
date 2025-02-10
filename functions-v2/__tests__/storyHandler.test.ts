
import { generateStory } from '../src/handlers/storyHandler';
import { generateStoryWithAI } from '../src/services/openaiService';
import * as admin from 'firebase-admin';
import { StoryMetrics } from '../src/utils/monitoring';

jest.mock('../src/services/openaiService');
jest.mock('firebase-admin');
jest.mock('../src/utils/monitoring');

describe('Story Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (StoryMetrics.startOperation as jest.Mock).mockClear();
    (StoryMetrics.endOperation as jest.Mock).mockClear();
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

  describe('Basic Functionality', () => {
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
      expect(StoryMetrics.startOperation).toHaveBeenCalledWith('test-story-id');
      expect(StoryMetrics.endOperation).toHaveBeenCalledWith('test-story-id', 'success');
    });

    it('should handle authentication errors', async () => {
      const unauthenticatedRequest = {
        ...mockRequest,
        auth: null,
      };

      await expect(generateStory(unauthenticatedRequest))
        .rejects
        .toThrow('Utilisateur non authentifié');
      
      expect(StoryMetrics.endOperation).toHaveBeenCalledWith(
        'test-story-id',
        'error'
      );
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

  describe('Error Handling', () => {
    it('should handle OpenAI API errors', async () => {
      (generateStoryWithAI as jest.Mock).mockRejectedValue(
        new Error('OpenAI API Error')
      );

      await expect(generateStory(mockRequest))
        .rejects
        .toThrow('OpenAI API Error');
      
      expect(StoryMetrics.endOperation).toHaveBeenCalledWith(
        'test-story-id',
        'error'
      );
    });

    it('should handle Firestore transaction errors', async () => {
      (generateStoryWithAI as jest.Mock).mockResolvedValue({
        story_text: 'Test story',
        preview: 'Test preview',
        wordCount: 1000,
      });

      (admin.firestore as jest.Mock)().runTransaction.mockRejectedValue(
        new Error('Transaction Failed')
      );

      await expect(generateStory(mockRequest))
        .rejects
        .toThrow('Transaction Failed');
    });

    it('should handle memory usage limits', async () => {
      const mockGeneratedStory = {
        story_text: 'A'.repeat(1000000), // Large story to test memory
        preview: 'Test preview',
        wordCount: 1000000,
      };

      (generateStoryWithAI as jest.Mock).mockResolvedValue(mockGeneratedStory);

      const mockStoryDoc = {
        exists: true,
        data: () => ({ _version: 1 }),
      };

      const mockTransaction = {
        get: jest.fn().mockResolvedValue(mockStoryDoc),
        update: jest.fn(),
      };

      (admin.firestore as jest.Mock)().runTransaction.mockImplementation(
        async (callback) => callback(mockTransaction)
      );

      const result = await generateStory(mockRequest);
      expect(result.wordCount).toBe(1000000);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track execution time', async () => {
      const mockGeneratedStory = {
        story_text: 'Test story',
        preview: 'Test preview',
        wordCount: 1000,
      };

      (generateStoryWithAI as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockGeneratedStory), 100))
      );

      const mockStoryDoc = {
        exists: true,
        data: () => ({ _version: 1 }),
      };

      const mockTransaction = {
        get: jest.fn().mockResolvedValue(mockStoryDoc),
        update: jest.fn(),
      };

      (admin.firestore as jest.Mock)().runTransaction.mockImplementation(
        async (callback) => callback(mockTransaction)
      );

      const startTime = Date.now();
      await generateStory(mockRequest);
      const duration = Date.now() - startTime;

      expect(duration).toBeGreaterThanOrEqual(100);
    });

    it('should handle concurrent requests', async () => {
      const mockGeneratedStory = {
        story_text: 'Test story',
        preview: 'Test preview',
        wordCount: 1000,
      };

      (generateStoryWithAI as jest.Mock).mockResolvedValue(mockGeneratedStory);

      const mockStoryDoc = {
        exists: true,
        data: () => ({ _version: 1 }),
      };

      const mockTransaction = {
        get: jest.fn().mockResolvedValue(mockStoryDoc),
        update: jest.fn(),
      };

      (admin.firestore as jest.Mock)().runTransaction.mockImplementation(
        async (callback) => callback(mockTransaction)
      );

      // Simuler 3 requêtes concurrentes
      const requests = Array(3).fill(mockRequest).map((req, i) => ({
        ...req,
        data: { ...req.data, storyId: `test-story-${i}` }
      }));

      await Promise.all(requests.map(generateStory));

      expect(StoryMetrics.startOperation).toHaveBeenCalledTimes(3);
      expect(StoryMetrics.endOperation).toHaveBeenCalledTimes(3);
    });
  });
});

import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

// Nettoyage automatique après chaque test
afterEach(() => {
  cleanup();
});

// Configuration globale de l'environnement de test
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Suppression des warnings de console pendant les tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
};
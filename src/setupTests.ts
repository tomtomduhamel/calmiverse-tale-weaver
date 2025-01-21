import '@testing-library/jest-dom/vitest';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';

// Extension des matchers de Jest avec ceux de @testing-library/jest-dom
expect.extend(matchers);

// Nettoyage automatique après chaque test
afterEach(() => {
  cleanup();
});

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Create a custom renderer that includes providers if needed
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { ...options });

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Helper function to wait for promises
export const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

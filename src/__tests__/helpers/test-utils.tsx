
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { User, Session } from '@supabase/supabase-js';

// Create a custom renderer that includes providers if needed
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { ...options });

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Import and explicitly export the commonly used functions to ensure they're available
import * as testingLibrary from '@testing-library/react';
export const screen = testingLibrary.screen;
export const fireEvent = testingLibrary.fireEvent;

// Helper function to wait for promises
export const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

// Create a mock User that satisfies the Supabase User type
export const createMockUser = (id: string = 'user-123'): User => ({
  id,
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  email: 'test@example.com',
  phone: '',
  confirmed_at: new Date().toISOString(),
  email_confirmed_at: new Date().toISOString(),
  phone_confirmed_at: null,
  last_sign_in_at: new Date().toISOString(),
  role: 'authenticated',
  factors: null,
});

// Create a mock Session that satisfies the Supabase Session type
export const createMockSession = (user: User): Session => ({
  user,
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_at: Date.now() + 3600,
  expires_in: 3600,
  token_type: 'bearer',
});

/// <reference types="vite/client" />
/// <reference types="@testing-library/jest-dom" />
/// <reference types="vitest/globals" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare namespace Vi {
  interface Assertion extends jest.Matchers<void, any> {}
  interface AsymmetricMatchersContaining extends jest.Matchers<void, any> {}
}

declare module '@testing-library/jest-dom' {
  export * from '@testing-library/jest-dom/matchers'
}

declare module '@testing-library/jest-dom/matchers' {
  export interface Matchers<R = void, T = {}> {
    toBeInTheDocument(): R;
    toHaveTextContent(text: string | RegExp): R;
    toBeVisible(): R;
    toHaveClass(className: string): R;
    toHaveAttribute(attr: string, value?: string): R;
  }
}
import { createRoot } from 'react-dom/client';
import { initializeErrorHandlers } from './utils/errorHandler';
import App from './App.tsx';
import './index.css';

// Initialize basic error handling before any other code runs
initializeErrorHandlers();

createRoot(document.getElementById("root")!).render(<App />);
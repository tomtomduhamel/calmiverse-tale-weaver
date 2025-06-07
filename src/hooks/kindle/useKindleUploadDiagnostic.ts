
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DiagnosticResult {
  timestamp: string;
  step: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: any;
}

export const useKindleUploadDiagnostic = () => {
  const [diagnosticLogs, setDiagnosticLogs] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = useCallback((log: Omit<DiagnosticResult, 'timestamp'>) => {
    const newLog: DiagnosticResult = {
      ...log,
      timestamp: new Date().toISOString()
    };
    setDiagnosticLogs(prev => [...prev, newLog]);
    console.log('📊 [KindleDiagnostic]', newLog);
    return newLog;
  }, []);

  const testConnectivity = useCallback(async () => {
    const startTime = Date.now();
    try {
      // Use the correct Supabase URL from the client configuration
      const supabaseUrl = "https://ioeihnoxvtpxtqhxklpw.supabase.co";
      const response = await fetch(`${supabaseUrl}/functions/v1/upload-epub`, {
        method: 'OPTIONS',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZWlobm94dnRweHRxaHhrbHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5ODQ1MzYsImV4cCI6MjA2MTU2MDUzNn0.5KolFPfnppqfb8lbYnWhJKo6GZL_VCxn3Zx1hxyLaro`,
        }
      });
      
      const duration = Date.now() - startTime;
      const success = response.ok;
      
      addLog({
        step: 'connectivity_test',
        success,
        duration,
        details: { status: response.status, statusText: response.statusText }
      });
      
      return success;
    } catch (error) {
      const duration = Date.now() - startTime;
      addLog({
        step: 'connectivity_test',
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Network error',
        details: { error }
      });
      return false;
    }
  }, [addLog]);

  const testEpubGeneration = useCallback(async (content: string, filename: string) => {
    const startTime = Date.now();
    try {
      const { data, error } = await supabase.functions.invoke('upload-epub', {
        body: { content, filename }
      });

      const duration = Date.now() - startTime;
      const success = !error && data?.url;

      addLog({
        step: 'epub_generation',
        success,
        duration,
        error: error?.message,
        details: { 
          hasData: !!data, 
          hasUrl: !!data?.url,
          contentLength: content.length,
          filename 
        }
      });

      return { success, data, error };
    } catch (error) {
      const duration = Date.now() - startTime;
      addLog({
        step: 'epub_generation',
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: { error, contentLength: content.length, filename }
      });
      return { success: false, error };
    }
  }, [addLog]);

  const runFullDiagnostic = useCallback(async (content: string, filename: string) => {
    setIsRunning(true);
    setDiagnosticLogs([]);

    try {
      // Test 1: Connectivité
      const connectivityOk = await testConnectivity();
      if (!connectivityOk) {
        throw new Error('Connectivity test failed');
      }

      // Test 2: Génération EPUB
      const epubResult = await testEpubGeneration(content, filename);
      
      return epubResult;
    } finally {
      setIsRunning(false);
    }
  }, [testConnectivity, testEpubGeneration]);

  const clearLogs = useCallback(() => {
    setDiagnosticLogs([]);
  }, []);

  return {
    diagnosticLogs,
    isRunning,
    testConnectivity,
    testEpubGeneration,
    runFullDiagnostic,
    clearLogs
  };
};

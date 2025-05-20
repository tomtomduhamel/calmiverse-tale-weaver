
import React from "react";
import { SimpleLoader } from "@/components/ui/SimpleLoader";
import { ErrorDisplay } from "@/components/ui/ErrorDisplay";

interface LoadingErrorHandlerProps {
  isLoading: boolean;
  error: Error | null;
  children: React.ReactNode;
}

const LoadingErrorHandler: React.FC<LoadingErrorHandlerProps> = ({
  isLoading,
  error,
  children
}) => {
  if (isLoading) {
    return <SimpleLoader />;
  }

  if (error) {
    return <ErrorDisplay message={error.message} onRetry={() => window.location.reload()} />;
  }

  return <>{children}</>;
};

export default LoadingErrorHandler;


import React from "react";
import type { Child } from "@/types/child";

interface N8nDebugPanelProps {
  children: Child[];
  selectedChildrenIds: string[];
  hasChildren: boolean;
  isFormValid: boolean;
}

const N8nDebugPanel: React.FC<N8nDebugPanelProps> = ({
  children,
  selectedChildrenIds,
  hasChildren,
  isFormValid
}) => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded border text-xs">
      <strong>🐛 Debug Info:</strong>
      <pre className="mt-1 overflow-auto">
        {JSON.stringify({
          childrenReceived: !!children,
          childrenCount: children?.length || 0,
          selectedCount: selectedChildrenIds.length,
          hasChildren,
          isFormValid
        }, null, 2)}
      </pre>
    </div>
  );
};

export default N8nDebugPanel;

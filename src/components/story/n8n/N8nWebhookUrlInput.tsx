
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface N8nWebhookUrlInputProps {
  webhookUrl: string;
  onWebhookUrlChange: (url: string) => void;
}

const N8nWebhookUrlInput: React.FC<N8nWebhookUrlInputProps> = ({
  webhookUrl,
  onWebhookUrlChange
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="webhookUrl">URL Webhook n8n</Label>
      <Input
        id="webhookUrl"
        type="url"
        placeholder="https://votre-instance.n8n.cloud/webhook/..."
        value={webhookUrl}
        onChange={(e) => onWebhookUrlChange(e.target.value)}
        required
      />
      <p className="text-xs text-muted-foreground">
        L'URL du webhook de votre workflow n8n pour la génération d'histoires
      </p>
    </div>
  );
};

export default N8nWebhookUrlInput;

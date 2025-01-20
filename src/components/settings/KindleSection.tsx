import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mail } from 'lucide-react';

interface KindleSectionProps {
  kindleEmail: string;
}

export const KindleSection = ({ kindleEmail }: KindleSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Paramètres Kindle
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Email Kindle</label>
          <Input value={kindleEmail} readOnly className="bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
};
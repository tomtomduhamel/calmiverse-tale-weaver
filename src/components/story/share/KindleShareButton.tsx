import React from 'react';
import { Button } from "@/components/ui/button";
import { Book, Loader2 } from "lucide-react";

interface KindleShareButtonProps {
  isLoading: boolean;
  onClick: () => void;
}

const KindleShareButton = ({ isLoading, onClick }: KindleShareButtonProps) => {
  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      variant="outline"
      className="w-full"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Book className="mr-2 h-4 w-4" />
          Envoyer sur Kindle
        </>
      )}
    </Button>
  );
};

export default KindleShareButton;
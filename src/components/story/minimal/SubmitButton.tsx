
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";

interface SubmitButtonProps {
  isSubmitting: boolean;
  disabled: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ isSubmitting, disabled }) => {
  return (
    <Button
      type="submit"
      className="w-full sm:w-auto sm:px-8"
      size="lg"
      disabled={isSubmitting || disabled}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Création en cours...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Générer une histoire
        </>
      )}
    </Button>
  );
};

export default SubmitButton;

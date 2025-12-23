import React, { useState } from "react";
import { Story } from "@/types/story";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Minus, Plus, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

interface PublicStoryReaderProps {
  story: Story;
  onClose: () => void;
}

const PublicStoryReader: React.FC<PublicStoryReaderProps> = ({ story, onClose }) => {
  const [fontSize, setFontSize] = useState(18);
  const { resolvedTheme, setTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  const increaseFontSize = () => setFontSize((prev) => Math.min(prev + 2, 32));
  const decreaseFontSize = () => setFontSize((prev) => Math.max(prev - 2, 12));
  const toggleTheme = () => setTheme(isDarkMode ? "light" : "dark");

  // Construire l'URL de l'image si disponible
  const imageUrl = story.image_path
    ? supabase.storage.from("storyimages").getPublicUrl(story.image_path).data.publicUrl
    : null;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "bg-gray-900" : "bg-background"}`}>
      {/* Header */}
      <header className={`sticky top-0 z-10 border-b ${isDarkMode ? "bg-gray-900 border-gray-700" : "bg-background border-border"}`}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Retour</span>
          </Button>

          <h1 className={`text-lg font-semibold truncate max-w-[200px] sm:max-w-md ${isDarkMode ? "text-white" : "text-foreground"}`}>
            {story.title}
          </h1>

          <div className="flex items-center gap-2">
            {/* Contrôles de taille de police */}
            <Button
              variant="ghost"
              size="icon"
              onClick={decreaseFontSize}
              disabled={fontSize <= 12}
              className="h-8 w-8"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className={`text-sm min-w-[2rem] text-center ${isDarkMode ? "text-gray-300" : "text-muted-foreground"}`}>
              {fontSize}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={increaseFontSize}
              disabled={fontSize >= 32}
              className="h-8 w-8"
            >
              <Plus className="h-4 w-4" />
            </Button>

            {/* Toggle thème */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Image de l'histoire */}
        {imageUrl && (
          <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
            <img
              src={imageUrl}
              alt={story.title}
              className="w-full h-auto max-h-[400px] object-cover"
            />
          </div>
        )}

        {/* Titre */}
        <h1
          className={`text-2xl sm:text-3xl font-bold mb-6 text-center ${isDarkMode ? "text-white" : "text-foreground"}`}
          style={{ fontSize: fontSize + 8 }}
        >
          {story.title}
        </h1>

        {/* Résumé si disponible */}
        {story.story_summary && (
          <div className={`mb-8 p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-muted"}`}>
            <p
              className={`italic ${isDarkMode ? "text-gray-300" : "text-muted-foreground"}`}
              style={{ fontSize: fontSize - 2 }}
            >
              {story.story_summary}
            </p>
          </div>
        )}

        {/* Contenu de l'histoire */}
        <article
          className={`prose prose-lg max-w-none ${isDarkMode ? "prose-invert" : ""}`}
          style={{ fontSize }}
        >
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1
                  className={`text-2xl font-bold mt-8 mb-4 ${isDarkMode ? "text-white" : "text-foreground"}`}
                  style={{ fontSize: fontSize + 6 }}
                >
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2
                  className={`text-xl font-semibold mt-6 mb-3 ${isDarkMode ? "text-white" : "text-foreground"}`}
                  style={{ fontSize: fontSize + 4 }}
                >
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3
                  className={`text-lg font-medium mt-4 mb-2 ${isDarkMode ? "text-white" : "text-foreground"}`}
                  style={{ fontSize: fontSize + 2 }}
                >
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p
                  className={`mb-4 leading-relaxed ${isDarkMode ? "text-gray-200" : "text-foreground"}`}
                  style={{ fontSize, lineHeight: 1.8 }}
                >
                  {children}
                </p>
              ),
              strong: ({ children }) => (
                <strong className={`font-bold ${isDarkMode ? "text-white" : "text-foreground"}`}>
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em className={isDarkMode ? "text-gray-300" : "text-muted-foreground"}>
                  {children}
                </em>
              ),
            }}
          >
            {story.content || ""}
          </ReactMarkdown>
        </article>

        {/* Footer */}
        <footer className={`mt-12 pt-6 border-t text-center ${isDarkMode ? "border-gray-700" : "border-border"}`}>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-muted-foreground"}`}>
            Histoire créée avec Calmi
          </p>
        </footer>
      </main>
    </div>
  );
};

export default PublicStoryReader;

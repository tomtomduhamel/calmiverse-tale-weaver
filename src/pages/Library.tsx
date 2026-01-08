import React, { useEffect, useCallback } from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BookOpen, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PWAGestures } from "@/components/PWAGestures";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PendingSharesList from "@/components/story/share/PendingSharesList";
import { usePendingShares } from "@/hooks/stories/useStorySharing";
import { Badge } from "@/components/ui/badge";
import LibraryFeed from "@/components/library/LibraryFeed";

const Library: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "stories";
  
  const { user, loading: authLoading } = useSupabaseAuth();
  const { pendingCount, refetch: refetchPendingShares } = usePendingShares();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Handle navigation from notifications
  useEffect(() => {
    const handleCalmiNavigate = (event: CustomEvent) => {
      const { path, tab } = event.detail || {};
      if (path === "/library" && tab === "shared") {
        setSearchParams({ tab: "shared" });
      }
    };

    window.addEventListener("calmi-navigate", handleCalmiNavigate as EventListener);
    return () => {
      window.removeEventListener("calmi-navigate", handleCalmiNavigate as EventListener);
    };
  }, [setSearchParams]);

  const handleTabChange = (value: string) => {
    if (value === "stories") {
      setSearchParams({});
    } else {
      setSearchParams({ tab: value });
    }
  };

  const handleShareAccepted = async () => {
    await refetchPendingShares();
    toast({
      title: "Histoire ajoutée",
      description: "L'histoire partagée a été ajoutée à votre bibliothèque"
    });
  };

  const handleCreateSequel = useCallback((storyId: string) => {
    // Navigate to story with sequel creation flow
    navigate(`/reader/${storyId}?createSequel=true`);
  }, [navigate]);

  const handleShare = useCallback((storyId: string) => {
    // Navigate to story with share modal open
    navigate(`/reader/${storyId}?share=true`);
  }, [navigate]);

  // Loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Auth check
  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <PWAGestures onPullToRefresh={() => window.location.reload()} className="min-h-screen">
      <div className="min-h-screen bg-background pwa-safe-area overflow-x-hidden">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold mb-1">
              Ma Bibliothèque
            </h1>
            <p className="text-sm text-muted-foreground">
              Vos histoires personnalisées
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full max-w-xs mx-auto grid-cols-2 mb-6">
              <TabsTrigger value="stories" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Histoires
              </TabsTrigger>
              <TabsTrigger value="shared" className="flex items-center gap-2 relative">
                <Share2 className="w-4 h-4" />
                Partagées
                {pendingCount > 0 && (
                  <Badge className="ml-1 bg-primary text-primary-foreground text-xs min-w-[1.2rem] h-5 px-1">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stories" className="mt-0">
              <LibraryFeed 
                onCreateSequel={handleCreateSequel}
                onShare={handleShare}
              />
            </TabsContent>

            <TabsContent value="shared">
              <PendingSharesList onShareAccepted={handleShareAccepted} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PWAGestures>
  );
};

export default Library;

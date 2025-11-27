import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Star, RefreshCw, Filter, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserFeedback {
  id: string;
  user_id: string;
  rating: number;
  feedback_text: string | null;
  page_url: string;
  device_info: any;
  created_at: string;
}

const AdminFeedback: React.FC = () => {
  const { toast } = useToast();
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  useEffect(() => {
    document.title = "Feedback Utilisateurs | Admin Calmiverse";
    void fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_feedback")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setFeedbacks(data || []);
    } catch (e: any) {
      toast({ 
        title: "Erreur", 
        description: e.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedbacks = feedbacks.filter((feedback) => {
    // Filter par rating
    if (ratingFilter !== "all" && feedback.rating !== parseInt(ratingFilter)) {
      return false;
    }

    // Filter par date
    if (dateFilter !== "all") {
      const feedbackDate = new Date(feedback.created_at);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - feedbackDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dateFilter === "today" && daysDiff > 0) return false;
      if (dateFilter === "week" && daysDiff > 7) return false;
      if (dateFilter === "month" && daysDiff > 30) return false;
    }

    return true;
  });

  const stats = {
    total: feedbacks.length,
    excellent: feedbacks.filter(f => f.rating === 5).length,
    good: feedbacks.filter(f => f.rating >= 4).length,
    neutral: feedbacks.filter(f => f.rating === 3).length,
    poor: feedbacks.filter(f => f.rating <= 2).length,
    avgRating: feedbacks.length > 0 
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
      : "0",
  };

  const getRatingBadge = (rating: number) => {
    const colors = {
      5: "bg-green-500",
      4: "bg-blue-500",
      3: "bg-yellow-500",
      2: "bg-orange-500",
      1: "bg-red-500",
    };
    return colors[rating as keyof typeof colors] || "bg-gray-500";
  };

  const getRatingEmoji = (rating: number) => {
    const emojis = {
      5: "🎉",
      4: "😊",
      3: "👍",
      2: "😐",
      1: "😞",
    };
    return emojis[rating as keyof typeof emojis] || "🤔";
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Feedback Utilisateurs</h1>
          <p className="text-muted-foreground mt-1">
            Analysez les retours de vos utilisateurs beta
          </p>
        </div>
        <Button onClick={fetchFeedbacks} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card className="p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{stats.avgRating} ⭐</div>
          <div className="text-sm text-muted-foreground">Moyenne</div>
        </Card>
        <Card className="p-4 bg-green-50 dark:bg-green-950">
          <div className="text-2xl font-bold text-green-600">{stats.excellent}</div>
          <div className="text-sm text-muted-foreground">Excellent (5★)</div>
        </Card>
        <Card className="p-4 bg-blue-50 dark:bg-blue-950">
          <div className="text-2xl font-bold text-blue-600">{stats.good}</div>
          <div className="text-sm text-muted-foreground">Bon (4-5★)</div>
        </Card>
        <Card className="p-4 bg-red-50 dark:bg-red-950">
          <div className="text-2xl font-bold text-red-600">{stats.poor}</div>
          <div className="text-sm text-muted-foreground">Faible (1-2★)</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Note" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les notes</SelectItem>
                <SelectItem value="5">5 étoiles</SelectItem>
                <SelectItem value="4">4 étoiles</SelectItem>
                <SelectItem value="3">3 étoiles</SelectItem>
                <SelectItem value="2">2 étoiles</SelectItem>
                <SelectItem value="1">1 étoile</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2 flex-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les dates</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(ratingFilter !== "all" || dateFilter !== "all") && (
            <Button 
              variant="outline" 
              onClick={() => {
                setRatingFilter("all");
                setDateFilter("all");
              }}
            >
              Réinitialiser
            </Button>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground mt-3">
          {filteredFeedbacks.length} feedback{filteredFeedbacks.length > 1 ? 's' : ''} affiché{filteredFeedbacks.length > 1 ? 's' : ''}
        </div>
      </Card>

      {/* Feedback List */}
      <div className="space-y-4">
        {loading ? (
          <Card className="p-8 text-center text-muted-foreground">
            Chargement des feedbacks...
          </Card>
        ) : filteredFeedbacks.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Aucun feedback trouvé
          </Card>
        ) : (
          filteredFeedbacks.map((feedback) => (
            <Card key={feedback.id} className="p-6">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                {/* Left Section */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge className={`${getRatingBadge(feedback.rating)} text-white`}>
                      {Array.from({ length: feedback.rating }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-current inline" />
                      ))}
                    </Badge>
                    <span className="text-2xl">{getRatingEmoji(feedback.rating)}</span>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(feedback.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                    </span>
                  </div>

                  {feedback.feedback_text && (
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{feedback.feedback_text}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="font-mono">
                      {feedback.page_url}
                    </Badge>
                    {feedback.device_info?.platform && (
                      <Badge variant="outline">
                        {feedback.device_info.platform}
                      </Badge>
                    )}
                    {feedback.device_info?.screenWidth && (
                      <Badge variant="outline">
                        {feedback.device_info.screenWidth}×{feedback.device_info.screenHeight}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Right Section - User ID */}
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {feedback.user_id.slice(0, 8)}...
                  </Badge>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminFeedback;

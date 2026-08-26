import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Zap, 
  Shield, 
  Database, 
  Cloud,
  RefreshCw,
  Activity
} from "lucide-react";
import { systemHealthService, SystemHealthSummary } from "@/services/monitoring/systemHealthService";

export const ServiceStatusPage = () => {
  const navigate = useNavigate();
  const [health, setHealth] = useState<SystemHealthSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHealth = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await systemHealthService.checkHealth();
      setHealth(data);
    } catch (err) {
      console.error("Erreur lors de la vérification du statut:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHealth();
  }, [fetchHealth]);

  const services = [
    {
      name: health?.storyService.name || "Génération d'histoires IA",
      status: health?.storyService.status || "operational",
      icon: Zap,
      description: health?.storyService.details || "Création narrative adaptée aux enfants",
      uptime: `${health?.storyService.uptimePercent ?? 99.9}%`
    },
    {
      name: health?.audioService.name || "Synthèse vocale (Modal GPU / OpenAI TTS)",
      status: health?.audioService.status || "operational",
      icon: Cloud,
      description: health?.audioService.details || "Inférence Kokoro TTS & clonage de voix",
      uptime: `${health?.audioService.uptimePercent ?? 99.8}%`
    },
    {
      name: health?.databaseService.name || "Base de données & Stockage",
      status: health?.databaseService.status || "operational",
      icon: Database,
      description: health?.databaseService.details || "PostgreSQL & Supabase Storage",
      uptime: `${health?.databaseService.uptimePercent ?? 99.9}%`
    },
    {
      name: health?.authService.name || "Authentification & Sécurité",
      status: health?.authService.status || "operational", 
      icon: Shield,
      description: health?.authService.details || "Gestion sessions, RLS et quotas",
      uptime: `${health?.authService.uptimePercent ?? 100}%`
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "degraded":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "outage":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "operational":
        return "Opérationnel";
      case "degraded":
        return "Dégradé";
      case "outage":
        return "Indisponible";
      default:
        return "Inconnu";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "text-green-600 bg-green-500/10 border-green-500/20";
      case "degraded":
        return "text-yellow-600 bg-yellow-500/10 border-yellow-500/20";
      case "outage":
        return "text-red-600 bg-red-500/10 border-red-500/20";
      default:
        return "text-gray-600 bg-gray-500/10 border-gray-500/20";
    }
  };

  const isAllOperational = health?.overallStatus === "operational";

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchHealth}
          disabled={isLoading}
          className="text-xs"
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      <Card className="mb-8 border-border/60 bg-card/80 backdrop-blur-sm shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Activity className="h-6 w-6 text-primary animate-pulse" />
            <CardTitle className="text-2xl sm:text-3xl font-bold text-center">
              Statut du Système Calmi
            </CardTitle>
          </div>
          <p className="text-center text-xs sm:text-sm text-muted-foreground">
            Surveillance et télémétrie en temps réel des services de production
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-8 p-4 rounded-xl border border-border/40 bg-muted/20">
            <div className="flex items-center justify-center mb-2">
              {isAllOperational ? (
                <>
                  <CheckCircle className="h-7 w-7 text-emerald-500 mr-2" />
                  <span className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    Tous les systèmes sont opérationnels
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-7 w-7 text-amber-500 mr-2" />
                  <span className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
                    Performances temporairement dégradées
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Dernière analyse télémétrique : {health?.checkedAt ? new Date(health.checkedAt).toLocaleTimeString('fr-FR') : "En cours..."}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground tracking-wide uppercase">
              Services Applicatifs
            </h3>
            
            <div className="grid gap-3">
              {services.map((service, index) => {
                const IconComponent = service.icon;
                return (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/60 hover:bg-background/90 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">{service.name}</h4>
                        <p className="text-xs text-muted-foreground">{service.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-right">
                      <div className="hidden sm:block">
                        <span className="text-xs font-mono font-medium text-foreground">{service.uptime}</span>
                        <p className="text-[10px] text-muted-foreground">disponibilité (24h)</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${getStatusColor(service.status)}`}>
                        {getStatusIcon(service.status)}
                        {getStatusText(service.status)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceStatusPage;
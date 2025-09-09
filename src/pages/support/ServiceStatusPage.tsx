import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, AlertCircle, Clock, Zap, Shield, Database, Cloud } from "lucide-react";

export const ServiceStatusPage = () => {
  const navigate = useNavigate();

  // Simuler le statut des services (en production, cela viendrait d'une API)
  const services = [
    {
      name: "Génération d'histoires",
      status: "operational",
      icon: Zap,
      description: "Service de création d'histoires par IA",
      uptime: "99.9%"
    },
    {
      name: "Authentification",
      status: "operational", 
      icon: Shield,
      description: "Connexion et gestion des comptes",
      uptime: "100%"
    },
    {
      name: "Base de données",
      status: "operational",
      icon: Database,
      description: "Stockage des profils et histoires",
      uptime: "99.8%"
    },
    {
      name: "Lecteur audio",
      status: "operational",
      icon: Cloud,
      description: "Synthèse vocale et lecture audio",
      uptime: "99.7%"
    }
  ];

  const recentIncidents = [
    {
      date: "15 Août 2024",
      title: "Ralentissement temporaire de la génération",
      status: "resolved",
      duration: "12 minutes",
      description: "Pic de trafic ayant causé des délais dans la génération d'histoires"
    }
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
        return "text-green-600 bg-green-50 border-green-200";
      case "degraded":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "outage":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour
      </Button>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            Statut du Service
          </CardTitle>
          <p className="text-center text-muted-foreground">
            Surveillance en temps réel de nos services Calmiverse
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-8 w-8 text-green-500 mr-2" />
              <span className="text-2xl font-semibold text-green-600">Tous les systèmes opérationnels</span>
            </div>
            <p className="text-muted-foreground">
              Dernière vérification : {new Date().toLocaleString('fr-FR')}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>État des Services</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            return (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <IconComponent className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-medium">{service.name}</h3>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-sm ${getStatusColor(service.status)}`}>
                    {getStatusIcon(service.status)}
                    <span>{getStatusText(service.status)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Uptime: {service.uptime}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Incidents Récents</CardTitle>
        </CardHeader>
        <CardContent>
          {recentIncidents.length > 0 ? (
            <div className="space-y-4">
              {recentIncidents.map((incident, index) => (
                <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{incident.title}</h3>
                    <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                      Résolu
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {incident.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {incident.date} • Durée: {incident.duration}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Aucun incident récent à signaler
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Métriques de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">99.8%</div>
              <p className="text-sm text-muted-foreground">Uptime global</p>
              <p className="text-xs text-muted-foreground">30 derniers jours</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">1.2s</div>
              <p className="text-sm text-muted-foreground">Temps de réponse moyen</p>
              <p className="text-xs text-muted-foreground">Génération d'histoires</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">0</div>
              <p className="text-sm text-muted-foreground">Incidents ouverts</p>
              <p className="text-xs text-muted-foreground">Actuellement</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Questions sur la disponibilité de nos services ?
        </p>
        <Button 
          onClick={() => navigate('/contact')}
          variant="outline"
        >
          Nous contacter
        </Button>
      </div>
    </div>
  );
};
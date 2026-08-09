import React, { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { storyCritiqueService } from "@/services/critique/storyCritiqueService";
import { StoryCritique, QualityKPIs } from "@/types/critique";
import { QualityDashboardTab } from "./QualityDashboardTab";
import { UnitAnalysisTab } from "./UnitAnalysisTab";
import { CritiqueHistoryTab } from "./CritiqueHistoryTab";
import { CritiqueDetailModal } from "./CritiqueDetailModal";
import { 
  Sparkles, 
  BarChart3, 
  FileSpreadsheet, 
  ShieldCheck, 
  BookOpen
} from "lucide-react";

export const QualityCockpitSection: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState("dashboard");
  const [critiques, setCritiques] = useState<StoryCritique[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [ageFilter, setAgeFilter] = useState("all");
  const [objectiveFilter, setObjectiveFilter] = useState("all");

  // Modal d'inspection détaillée
  const [selectedCritique, setSelectedCritique] = useState<StoryCritique | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadCritiques = useCallback(async () => {
    setLoading(true);
    try {
      const data = await storyCritiqueService.fetchCritiques({
        age: ageFilter,
        objective: objectiveFilter,
        limit: 100
      });
      setCritiques(data);
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur lors de la récupération des critiques");
    } finally {
      setLoading(false);
    }
  }, [ageFilter, objectiveFilter]);

  useEffect(() => {
    loadCritiques();
  }, [loadCritiques]);

  const kpis: QualityKPIs = React.useMemo(() => {
    return storyCritiqueService.calculateKPIs(critiques);
  }, [critiques]);

  const handleOpenDetailModal = (c: StoryCritique) => {
    setSelectedCritique(c);
    setModalOpen(true);
  };

  const handleDeleteCritique = async (id: string) => {
    const ok = await storyCritiqueService.deleteCritique(id);
    if (ok) {
      toast.success("Critique supprimée");
      setCritiques((prev) => prev.filter((c) => c.id !== id));
      if (selectedCritique?.id === id) {
        setModalOpen(false);
      }
    } else {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Cockpit Qualité & Critique Littéraire Jeunesse
          </h2>
          <p className="text-xs text-muted-foreground">
            Audit littéraire automatisé, moyennes, médianes, tendances et détection des faiblesses récurrentes pour l'amélioration continue des histoires.
          </p>
        </div>

        <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-3 w-full md:w-auto">
            <TabsTrigger value="dashboard" className="text-xs flex items-center gap-1.5 px-3">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="unit" className="text-xs flex items-center gap-1.5 px-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analyse Unitaire</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs flex items-center gap-1.5 px-3">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Historique ({critiques.length})</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeSubTab === "dashboard" && (
        <QualityDashboardTab
          critiques={critiques}
          kpis={kpis}
          loading={loading}
          ageFilter={ageFilter}
          onAgeFilterChange={setAgeFilter}
          objectiveFilter={objectiveFilter}
          onObjectiveFilterChange={setObjectiveFilter}
          onRefresh={loadCritiques}
          onSelectCritique={handleOpenDetailModal}
          onNavigateToUnitAnalysis={() => setActiveSubTab("unit")}
        />
      )}

      {activeSubTab === "unit" && (
        <UnitAnalysisTab
          onCritiqueCreated={() => {
            loadCritiques();
          }}
        />
      )}

      {activeSubTab === "history" && (
        <CritiqueHistoryTab
          critiques={critiques}
          loading={loading}
          onRefresh={loadCritiques}
          onSelectCritique={handleOpenDetailModal}
          onDeleteCritique={handleDeleteCritique}
        />
      )}

      <CritiqueDetailModal
        critique={selectedCritique}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
};

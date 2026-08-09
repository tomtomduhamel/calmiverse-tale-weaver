import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { StoryCritique } from "@/types/critique";
import { 
  Search, 
  Trash2, 
  Eye, 
  Copy, 
  Check, 
  Sparkles, 
  RotateCcw,
  FileSpreadsheet
} from "lucide-react";
import { toast } from "sonner";

interface CritiqueHistoryTabProps {
  critiques: StoryCritique[];
  loading: boolean;
  onRefresh: () => void;
  onSelectCritique: (critique: StoryCritique) => void;
  onDeleteCritique: (id: string) => void;
}

export const CritiqueHistoryTab: React.FC<CritiqueHistoryTabProps> = ({
  critiques,
  loading,
  onRefresh,
  onSelectCritique,
  onDeleteCritique
}) => {
  const [search, setSearch] = useState("");

  const getScoreColor = (val: number) => {
    if (val >= 8.5) return "text-emerald-500 font-bold";
    if (val >= 7.0) return "text-green-500 font-bold";
    if (val >= 5.5) return "text-amber-500 font-bold";
    if (val >= 4.0) return "text-orange-500 font-bold";
    return "text-rose-500 font-bold";
  };

  const filtered = critiques.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.verdict.toLowerCase().includes(search.toLowerCase()) ||
    c.target_age.toLowerCase().includes(search.toLowerCase()) ||
    c.objective.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Card className="border-border">
        <CardHeader className="p-5 pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                Historique Complet des Évaluations ({critiques.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Base de données des audits littéraires réalisés
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par titre, verdict..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={onRefresh}
                disabled={loading}
                className="h-8 px-2.5 text-xs"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-[11px] text-muted-foreground">
                  <TableHead className="w-[200px]">Titre</TableHead>
                  <TableHead className="w-[80px] text-center">Note</TableHead>
                  <TableHead className="w-[100px]">Public / Obj.</TableHead>
                  <TableHead className="hidden md:table-cell">Verdict Synthétique</TableHead>
                  <TableHead className="w-[90px] text-center">Mots</TableHead>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Chargement des évaluations...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground italic">
                      Aucune évaluation trouvée.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold text-foreground">
                        <span className="truncate block max-w-[200px]">{c.title}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`text-sm font-mono ${getScoreColor(Number(c.overall_score))}`}>
                          {Number(c.overall_score).toFixed(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5 text-[11px]">
                          <Badge variant="outline" className="text-[9px] px-1 py-0 block w-fit">
                            {c.target_age}
                          </Badge>
                          <span className="text-muted-foreground text-[10px] block truncate">
                            {c.objective}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p className="text-[11px] text-muted-foreground italic line-clamp-1">
                          « {c.verdict} »
                        </p>
                      </TableCell>
                      <TableCell className="text-center font-mono text-[11px]">
                        {c.actual_word_count || c.stats?.actualWordCount || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-[11px]">
                        {new Date(c.created_at).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onSelectCritique(c)}
                            className="h-7 w-7 p-0"
                            title="Voir l'analyse détaillée"
                          >
                            <Eye className="w-3.5 h-3.5 text-primary" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer cette critique ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action supprimera l'évaluation de « {c.title} ». Les données analytiques associées seront mises à jour.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onDeleteCritique(c.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

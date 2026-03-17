import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Generic CRUD component for each table
interface IngredientTableProps<T extends { id: string; is_active: boolean }> {
  tableName: string;
  columns: { key: keyof T; label: string; type: "text" | "array" }[];
  data: T[] | undefined;
  isLoading: boolean;
}

const IngredientTable = <T extends { id: string; is_active: boolean }>({
  tableName,
  columns,
  data,
  isLoading,
}: IngredientTableProps<T>) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from(tableName as any)
        .update({ is_active } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["story-ingredients"] });
      queryClient.invalidateQueries({ queryKey: [`admin-${tableName}`] });
    },
  });

  const deleteRow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(tableName as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`admin-${tableName}`] });
      toast({ title: "Entrée supprimée" });
    },
  });

  const saveRow = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, any> }) => {
      const { error } = await supabase
        .from(tableName as any)
        .update(values as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: [`admin-${tableName}`] });
      queryClient.invalidateQueries({ queryKey: ["story-ingredients"] });
      toast({ title: "Sauvegardé" });
    },
  });

  const addRow = useMutation({
    mutationFn: async () => {
      const newRow: Record<string, any> = {};
      columns.forEach(col => {
        newRow[col.key as string] = col.type === "array" ? [] : "";
      });
      const { error } = await supabase.from(tableName as any).insert(newRow as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`admin-${tableName}`] });
      toast({ title: "Nouvelle entrée ajoutée" });
    },
  });

  const startEdit = (row: T) => {
    setEditingId(row.id);
    const values: Record<string, any> = {};
    columns.forEach(col => {
      const val = row[col.key];
      values[col.key as string] = col.type === "array" ? (val as string[] || []).join(", ") : val;
    });
    setEditValues(values);
  };

  const handleSave = (id: string) => {
    const processedValues: Record<string, any> = {};
    columns.forEach(col => {
      const raw = editValues[col.key as string];
      processedValues[col.key as string] = col.type === "array"
        ? (raw || "").split(",").map((s: string) => s.trim()).filter(Boolean)
        : raw;
    });
    saveRow.mutate({ id, values: processedValues });
  };

  if (isLoading) return <p className="p-4 text-muted-foreground">Chargement...</p>;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => addRow.mutate()} disabled={addRow.isPending}>
          <Plus className="h-4 w-4 mr-1" /> Ajouter
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(col => (
                <TableHead key={col.key as string}>{col.label}</TableHead>
              ))}
              <TableHead className="w-24">Actif</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map(row => (
              <TableRow key={row.id}>
                {columns.map(col => (
                  <TableCell key={col.key as string}>
                    {editingId === row.id ? (
                      <Input
                        value={editValues[col.key as string] || ""}
                        onChange={e => setEditValues(prev => ({ ...prev, [col.key as string]: e.target.value }))}
                        className="min-w-[150px]"
                      />
                    ) : (
                      <span className="text-sm">
                        {col.type === "array"
                          ? (row[col.key] as string[] || []).join(", ")
                          : String(row[col.key] || "")}
                      </span>
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  <Switch
                    checked={row.is_active}
                    onCheckedChange={checked => toggleActive.mutate({ id: row.id, is_active: checked })}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {editingId === row.id ? (
                      <Button size="icon" variant="ghost" onClick={() => handleSave(row.id)}>
                        <Save className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button size="icon" variant="ghost" onClick={() => startEdit(row)}>
                        <Save className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => deleteRow.mutate(row.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const StoryIngredients: React.FC = () => {
  const navigate = useNavigate();

  const ageCognition = useQuery({
    queryKey: ["admin-age_cognition"],
    queryFn: async () => {
      const { data } = await supabase.from("age_cognition").select("*").order("range");
      return data as any[];
    },
  });

  const narrativeSchemas = useQuery({
    queryKey: ["admin-narrative_schemas"],
    queryFn: async () => {
      const { data } = await supabase.from("narrative_schemas").select("*").order("type");
      return data as any[];
    },
  });

  const vakogFocus = useQuery({
    queryKey: ["admin-vakog_focus"],
    queryFn: async () => {
      const { data } = await supabase.from("vakog_focus").select("*").order("sensory_type");
      return data as any[];
    },
  });

  const symbolicUniverses = useQuery({
    queryKey: ["admin-symbolic_universes"],
    queryFn: async () => {
      const { data } = await supabase.from("symbolic_universes").select("*").order("name");
      return data as any[];
    },
  });

  const ericksonianTechniques = useQuery({
    queryKey: ["admin-ericksonian_techniques"],
    queryFn: async () => {
      const { data } = await supabase.from("ericksonian_techniques").select("*").order("name");
      return data as any[];
    },
  });

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Ingrédients narratifs</h1>
          <p className="text-sm text-muted-foreground">Gérer les éléments de variété pour la génération d'histoires</p>
        </div>
      </div>

      <Card className="p-4">
        <Tabs defaultValue="age_cognition">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="age_cognition">Cognition / Âge</TabsTrigger>
            <TabsTrigger value="narrative_schemas">Schémas narratifs</TabsTrigger>
            <TabsTrigger value="vakog_focus">VAKOG</TabsTrigger>
            <TabsTrigger value="symbolic_universes">Univers symboliques</TabsTrigger>
            <TabsTrigger value="ericksonian_techniques">Techniques Erickson</TabsTrigger>
          </TabsList>

          <TabsContent value="age_cognition">
            <IngredientTable
              tableName="age_cognition"
              columns={[
                { key: "range" as any, label: "Tranche d'âge", type: "text" },
                { key: "characteristics" as any, label: "Caractéristiques", type: "text" },
                { key: "preferred_supports" as any, label: "Supports préférés", type: "array" },
              ]}
              data={ageCognition.data}
              isLoading={ageCognition.isLoading}
            />
          </TabsContent>

          <TabsContent value="narrative_schemas">
            <IngredientTable
              tableName="narrative_schemas"
              columns={[
                { key: "type" as any, label: "Type", type: "text" },
                { key: "description" as any, label: "Description", type: "text" },
                { key: "mechanism" as any, label: "Mécanisme", type: "text" },
              ]}
              data={narrativeSchemas.data}
              isLoading={narrativeSchemas.isLoading}
            />
          </TabsContent>

          <TabsContent value="vakog_focus">
            <IngredientTable
              tableName="vakog_focus"
              columns={[
                { key: "sensory_type" as any, label: "Canal sensoriel", type: "text" },
                { key: "sensory_keywords" as any, label: "Mots-clés", type: "array" },
              ]}
              data={vakogFocus.data}
              isLoading={vakogFocus.isLoading}
            />
          </TabsContent>

          <TabsContent value="symbolic_universes">
            <IngredientTable
              tableName="symbolic_universes"
              columns={[
                { key: "name" as any, label: "Nom", type: "text" },
                { key: "description" as any, label: "Description", type: "text" },
                { key: "visual_style" as any, label: "Style visuel", type: "text" },
                { key: "objective_affinity" as any, label: "Affinité objectifs", type: "array" },
              ]}
              data={symbolicUniverses.data}
              isLoading={symbolicUniverses.isLoading}
            />
          </TabsContent>

          <TabsContent value="ericksonian_techniques">
            <IngredientTable
              tableName="ericksonian_techniques"
              columns={[
                { key: "name" as any, label: "Technique", type: "text" },
                { key: "linguistic_pattern" as any, label: "Pattern linguistique", type: "text" },
                { key: "objective_affinity" as any, label: "Affinité objectifs", type: "array" },
              ]}
              data={ericksonianTechniques.data}
              isLoading={ericksonianTechniques.isLoading}
            />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default StoryIngredients;

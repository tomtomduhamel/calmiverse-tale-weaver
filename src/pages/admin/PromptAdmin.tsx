import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminGuard from "@/components/admin/AdminGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Plus, Save, CheckCircle2 } from "lucide-react";

interface PromptTemplate {
  id: string;
  key: string;
  title: string;
  description: string | null;
  active_version_id: string | null;
  created_at: string;
  updated_at: string;
}

interface PromptVersion {
  id: string;
  template_id: string;
  version: number;
  content: string;
  changelog: string | null;
  created_by: string;
  created_at: string;
}

const PromptAdmin: React.FC = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [savingMeta, setSavingMeta] = useState(false);
  const [creatingVersion, setCreatingVersion] = useState(false);

  const selected = useMemo(
    () => templates.find(t => t.id === selectedId) || null,
    [templates, selectedId]
  );

  const [metaDraft, setMetaDraft] = useState<{ title: string; description: string; key: string }>({
    title: "",
    description: "",
    key: "",
  });

  const [newVersionDraft, setNewVersionDraft] = useState<{ content: string; changelog: string }>(
    { content: "", changelog: "" }
  );

  useEffect(() => {
    document.title = "Administration des prompts | Calmiverse";
    void fetchTemplates();
  }, []);

  useEffect(() => {
    if (selected) {
      setMetaDraft({
        title: selected.title,
        description: selected.description ?? "",
        key: selected.key,
      });
      void fetchVersions(selected.id);
    } else {
      setVersions([]);
    }
  }, [selectedId]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("prompt_templates")
        .select("id, key, title, description, active_version_id, created_at, updated_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      setTemplates(data || []);
      if (!selectedId && data && data.length > 0) setSelectedId(data[0].id);
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async (templateId: string) => {
    try {
      const { data, error } = await supabase
        .from("prompt_template_versions")
        .select("id, template_id, version, content, changelog, created_by, created_at")
        .eq("template_id", templateId)
        .order("version", { ascending: false });
      if (error) throw error;
      setVersions(data || []);
      if (data && data.length > 0) {
        setNewVersionDraft({ content: data[0].content, changelog: "" });
      } else {
        setNewVersionDraft({ content: "", changelog: "" });
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const createTemplate = async () => {
    try {
      const tKey = prompt("Clé technique (ex: story_generation):")?.trim();
      const tTitle = tKey ? prompt("Titre lisible:")?.trim() : undefined;
      if (!tKey || !tTitle) return;

      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id;
      if (!userId) throw new Error("Utilisateur non connecté");

      const { data, error } = await supabase
        .from("prompt_templates")
        .insert({ key: tKey, title: tTitle, description: null, created_by: userId })
        .select("id").maybeSingle();
      if (error) throw error;

      toast({ title: "Template créé", description: tKey });
      await fetchTemplates();
      if (data?.id) setSelectedId(data.id);
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const saveMeta = async () => {
    if (!selected) return;
    try {
      setSavingMeta(true);
      const { error } = await supabase
        .from("prompt_templates")
        .update({ title: metaDraft.title, description: metaDraft.description, key: metaDraft.key })
        .eq("id", selected.id);
      if (error) throw error;
      toast({ title: "Modifications enregistrées" });
      await fetchTemplates();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSavingMeta(false);
    }
  };

  const createNewVersion = async () => {
    if (!selected) return;
    try {
      setCreatingVersion(true);
      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id;
      if (!userId) throw new Error("Utilisateur non connecté");

      const nextVersion = (versions[0]?.version ?? 0) + 1;
      const { data, error } = await supabase
        .from("prompt_template_versions")
        .insert({
          template_id: selected.id,
          version: nextVersion,
          content: newVersionDraft.content,
          changelog: newVersionDraft.changelog || `Version ${nextVersion}`,
          created_by: userId,
        })
        .select("id, version").maybeSingle();
      if (error) throw error;

      toast({ title: "Version créée", description: `v${data?.version}` });
      await fetchVersions(selected.id);
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setCreatingVersion(false);
    }
  };

  const setActive = async (versionId: string) => {
    if (!selected) return;
    try {
      const { error } = await supabase
        .from("prompt_templates")
        .update({ active_version_id: versionId })
        .eq("id", selected.id);
      if (error) throw error;
      toast({ title: "Version activée" });
      await fetchTemplates();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  return (
    <AdminGuard>
      <main className="p-4 md:p-6 space-y-4">
        <header>
          <h1 className="text-2xl font-semibold">Administration des prompts</h1>
          <p className="text-sm text-muted-foreground">Gérez les templates et leurs versions utilisées pour la génération des histoires.</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">Templates</h2>
              <Button size="sm" onClick={createTemplate}>
                <Plus className="h-4 w-4 mr-1"/> Nouveau
              </Button>
            </div>
            <Separator />

            <div className="space-y-2 max-h-[60vh] overflow-auto">
              {loading && <p>Chargement...</p>}
              {!loading && templates.length === 0 && <p>Aucun template.</p>}
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left p-3 rounded-md border transition ${selectedId === t.id ? 'bg-muted' : 'hover:bg-muted/50'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{t.title}</div>
                      <div className="text-xs text-muted-foreground">{t.key}</div>
                    </div>
                    {t.active_version_id && selectedId === t.id && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <div className="md:col-span-2 space-y-4">
            {selected ? (
              <>
                <Card className="p-4 space-y-3">
                  <h2 className="font-medium">Métadonnées</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm">Titre</label>
                      <Input value={metaDraft.title} onChange={e => setMetaDraft(v => ({...v, title: e.target.value}))} />
                    </div>
                    <div>
                      <label className="text-sm">Clé</label>
                      <Input value={metaDraft.key} onChange={e => setMetaDraft(v => ({...v, key: e.target.value}))} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm">Description</label>
                      <Textarea value={metaDraft.description} onChange={e => setMetaDraft(v => ({...v, description: e.target.value}))} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveMeta} disabled={savingMeta}>
                      <Save className="h-4 w-4 mr-1"/> Enregistrer
                    </Button>
                  </div>
                </Card>

                <Card className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-medium">Versions</h2>
                    <Button variant="secondary" onClick={createNewVersion} disabled={creatingVersion}>
                      Créer une nouvelle version
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm">Contenu (nouvelle version)</label>
                    <Textarea
                      value={newVersionDraft.content}
                      onChange={e => setNewVersionDraft(v => ({...v, content: e.target.value}))}
                      className="min-h-[200px]"
                    />
                    <label className="text-sm">Changelog</label>
                    <Input
                      value={newVersionDraft.changelog}
                      onChange={e => setNewVersionDraft(v => ({...v, changelog: e.target.value}))}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3 max-h-[50vh] overflow-auto">
                    {versions.map(v => (
                      <div key={v.id} className="p-3 rounded-md border">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">Version v{v.version}</div>
                          <div className="flex items-center gap-2">
                            {selected.active_version_id === v.id && (
                              <span className="text-xs text-primary">Active</span>
                            )}
                            {selected.active_version_id !== v.id && (
                              <Button size="sm" onClick={() => setActive(v.id)}>Activer</Button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{v.changelog}</p>
                        <pre className="mt-2 bg-muted p-2 rounded whitespace-pre-wrap text-sm">
{v.content}
                        </pre>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            ) : (
              <Card className="p-6"><p>Sélectionnez un template à gauche.</p></Card>
            )}
          </div>
        </section>
      </main>
    </AdminGuard>
  );
};

export default PromptAdmin;

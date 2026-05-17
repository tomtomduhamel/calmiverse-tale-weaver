import React, { useEffect, useMemo, useState } from "react";
import SuperAdminGuard from "@/components/superadmin/SuperAdminGuard";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Loader2, RefreshCw, XCircle, Gift, RotateCcw, Trash2, Plus, ExternalLink, HelpCircle } from "lucide-react";

type Subscription = {
  user_id: string;
  tier: string;
  status: string;
  is_annual: boolean;
  current_period_start: string;
  current_period_end: string;
  stories_used_this_period: number;
  audio_generations_used_this_period: number;
  video_intros_used_this_period: number;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  stripe_price_id: string | null;
  email?: string;
  firstname?: string | null;
};

type PriceRow = {
  id: string;
  tier: string;
  is_annual: boolean;
  stripe_price_id: string;
  active: boolean;
};

type WebhookEvent = {
  id: string;
  stripe_event_id: string | null;
  type: string;
  status: string;
  error_message: string | null;
  user_id: string | null;
  created_at: string;
};

const TIERS = ["calmini", "calmidium", "calmix", "calmixxl"] as const;

const SuperAdmin: React.FC = () => {
  return (
    <SuperAdminGuard>
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Superadmin · Billing</h1>
              <p className="text-sm text-muted-foreground">Pilotage Stripe, abonnés et webhooks</p>
            </div>
          </header>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="subscribers">Abonnés</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              <TabsTrigger value="prices">Price mapping</TabsTrigger>
            </TabsList>
            <TabsContent value="overview"><OverviewTab /></TabsContent>
            <TabsContent value="subscribers"><SubscribersTab /></TabsContent>
            <TabsContent value="webhooks"><WebhooksTab /></TabsContent>
            <TabsContent value="prices"><PricesTab /></TabsContent>
          </Tabs>
        </div>
      </div>
    </SuperAdminGuard>
  );
};

const OverviewTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [limits, setLimits] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: s }, { data: l }] = await Promise.all([
        supabase.from("user_subscriptions").select("*"),
        supabase.from("subscription_limits").select("*"),
      ]);
      setSubs((s ?? []) as any);
      setLimits(l ?? []);
      setLoading(false);
    })();
  }, []);

  const kpis = useMemo(() => {
    const active = subs.filter((s) => s.status === "active");
    const byTier: Record<string, { monthly: number; annual: number }> = {};
    let mrr = 0;
    for (const s of active) {
      const lim = limits.find((x) => x.tier === s.tier);
      if (!lim) continue;
      byTier[s.tier] ??= { monthly: 0, annual: 0 };
      if (s.is_annual) {
        byTier[s.tier].annual++;
        mrr += Number(lim.annual_price_usd) / 12;
      } else {
        byTier[s.tier].monthly++;
        mrr += Number(lim.monthly_price_usd);
      }
    }
    const now = Date.now();
    const new7 = subs.filter((s) => now - new Date((s as any).created_at ?? s.current_period_start).getTime() < 7 * 86400e3).length;
    const new30 = subs.filter((s) => now - new Date((s as any).created_at ?? s.current_period_start).getTime() < 30 * 86400e3).length;
    return { mrr, arr: mrr * 12, active: active.length, total: subs.length, byTier, new7, new30 };
  }, [subs, limits]);

  if (loading) return <Card className="p-6 flex justify-center"><Loader2 className="animate-spin" /></Card>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard label="MRR estimé" value={`$${kpis.mrr.toFixed(0)}`} />
      <KpiCard label="ARR estimé" value={`$${kpis.arr.toFixed(0)}`} />
      <KpiCard label="Abonnés actifs" value={kpis.active} />
      <KpiCard label="Total abonnements" value={kpis.total} />
      <KpiCard label="Nouveaux (7j)" value={kpis.new7} />
      <KpiCard label="Nouveaux (30j)" value={kpis.new30} />
      <Card className="p-4 md:col-span-2">
        <h3 className="font-semibold mb-3">Répartition par tier</h3>
        <div className="space-y-2 text-sm">
          {TIERS.map((t) => {
            const b = kpis.byTier[t] ?? { monthly: 0, annual: 0 };
            return (
              <div key={t} className="flex items-center justify-between">
                <span className="capitalize">{t}</span>
                <span className="text-muted-foreground">
                  {b.monthly} mensuel · {b.annual} annuel
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

const KpiCard: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Card className="p-4">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="text-2xl font-bold mt-1">{value}</div>
  </Card>
);

const SubscribersTab: React.FC = () => {
  const [rows, setRows] = useState<Subscription[]>([]);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Subscription | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: subs } = await supabase.from("user_subscriptions").select("*").order("updated_at", { ascending: false });
    const userIds = (subs ?? []).map((s: any) => s.user_id);
    const { data: users } = userIds.length
      ? await supabase.from("users").select("id,email,firstname").in("id", userIds)
      : { data: [] as any };
    const byId = new Map((users ?? []).map((u: any) => [u.id, u]));
    setRows((subs ?? []).map((s: any) => ({ ...s, email: (byId.get(s.user_id) as any)?.email, firstname: (byId.get(s.user_id) as any)?.firstname })));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) => {
    if (tierFilter !== "all" && r.tier !== tierFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (search && !(r.email ?? "").toLowerCase().includes(search.toLowerCase()) && !(r.firstname ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <Card className="p-4 space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Recherche email/prénom" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les tiers</SelectItem>
            {TIERS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="active">active</SelectItem>
            <SelectItem value="trial">trial</SelectItem>
            <SelectItem value="cancelled">cancelled</SelectItem>
            <SelectItem value="expired">expired</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Rafraîchir
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground border-b">
            <tr><th className="p-2">Email</th><th>Tier</th><th>Statut</th><th>Période</th><th>Quotas</th><th>Stripe</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.user_id} className="border-b hover:bg-muted/40">
                <td className="p-2"><div className="font-medium">{r.email ?? r.user_id.slice(0, 8)}</div><div className="text-xs text-muted-foreground">{r.firstname}</div></td>
                <td><Badge variant="outline">{r.tier}{r.is_annual ? " · annuel" : ""}</Badge></td>
                <td><Badge variant={r.status === "active" ? "default" : "secondary"}>{r.status}</Badge></td>
                <td className="text-xs">→ {new Date(r.current_period_end).toLocaleDateString()}</td>
                <td className="text-xs">{r.stories_used_this_period}/{r.audio_generations_used_this_period}/{r.video_intros_used_this_period}</td>
                <td className="text-xs">{r.stripe_subscription_id ? "✓" : "—"}</td>
                <td><Button size="sm" variant="outline" onClick={() => setSelected(r)}>Gérer</Button></td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Aucun résultat</td></tr>}
          </tbody>
        </table>
      </div>
      {selected && <SubscriberDetailModal sub={selected} onClose={() => setSelected(null)} onRefresh={load} />}
    </Card>
  );
};

const SubscriberDetailModal: React.FC<{ sub: Subscription; onClose: () => void; onRefresh: () => void }> = ({ sub, onClose, onRefresh }) => {
  const [stripeData, setStripeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [prices, setPrices] = useState<PriceRow[]>([]);
  const [newPrice, setNewPrice] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.functions.invoke("superadmin-stripe-fetch", {
        method: "GET" as any,
        // workaround: supabase-js doesn't pass query params for invoke; call via direct URL instead
      });
      // Fallback: direct fetch
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch(`https://ioeihnoxvtpxtqhxklpw.supabase.co/functions/v1/superadmin-stripe-fetch?user_id=${sub.user_id}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const json = await res.json();
      setStripeData(json);
      const { data: p } = await supabase.from("stripe_price_mapping").select("*").eq("active", true);
      setPrices(p ?? []);
      setLoading(false);
    })();
  }, [sub.user_id]);

  const callAction = async (action: string, params: any = {}, confirmMsg?: string) => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("superadmin-stripe-action", {
        body: { action, target_user_id: sub.user_id, params },
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      toast.success(`${action} OK`);
      onRefresh();
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{sub.email}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Tier:</span> {sub.tier} {sub.is_annual && "(annuel)"}</div>
            <div><span className="text-muted-foreground">Statut:</span> {sub.status}</div>
            <div><span className="text-muted-foreground">Période:</span> {new Date(sub.current_period_end).toLocaleDateString()}</div>
            <div><span className="text-muted-foreground">Stripe sub:</span> {sub.stripe_subscription_id ?? "—"}</div>
          </div>

          <div className="border-t pt-3 space-y-2">
            <h4 className="font-semibold text-sm">Actions</h4>
            <div className="flex flex-wrap gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" disabled={busy}><RefreshCw className="h-3.5 w-3.5 mr-1" />Resynchroniser depuis Stripe</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Resynchroniser ?</AlertDialogTitle>
                    <AlertDialogDescription>Met à jour la DB depuis l'abonnement Stripe actuel.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={() => callAction("resync_user")}>Confirmer</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" disabled={busy}><RotateCcw className="h-3.5 w-3.5 mr-1" />Reset quotas</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Reset quotas ?</AlertDialogTitle>
                    <AlertDialogDescription>Remet stories/audio/video à 0 pour la période en cours.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={() => callAction("reset_quota")}>Confirmer</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" disabled={busy}><Gift className="h-3.5 w-3.5 mr-1" />Offrir un mois</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Offrir un mois ?</AlertDialogTitle>
                    <AlertDialogDescription>Applique un coupon 100%/once si Stripe, sinon prolonge la période en DB.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={() => callAction("grant_free_month")}>Confirmer</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" disabled={busy || !sub.stripe_subscription_id}><XCircle className="h-3.5 w-3.5 mr-1" />Annuler (fin de période)</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Annuler l'abonnement ?</AlertDialogTitle>
                    <AlertDialogDescription>Programmation à la fin de la période en cours.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Non</AlertDialogCancel>
                    <AlertDialogAction onClick={() => callAction("cancel_subscription", { at_period_end: true })}>Confirmer</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="flex items-end gap-2 pt-2">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Changer de plan (price_id)</label>
                <Select value={newPrice} onValueChange={setNewPrice}>
                  <SelectTrigger><SelectValue placeholder="Choisir un price..." /></SelectTrigger>
                  <SelectContent>
                    {prices.map((p) => <SelectItem key={p.id} value={p.stripe_price_id}>{p.tier}{p.is_annual ? " · annuel" : " · mensuel"} ({p.stripe_price_id})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" disabled={!newPrice || busy || !sub.stripe_subscription_id}>Appliquer</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Changer de plan ?</AlertDialogTitle>
                    <AlertDialogDescription>Crée une proration immédiate sur Stripe.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={() => callAction("change_plan", { new_price_id: newPrice })}>Confirmer</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <div className="border-t pt-3">
            <h4 className="font-semibold text-sm mb-2">Factures Stripe</h4>
            {loading ? <Loader2 className="animate-spin" /> : (
              <div className="space-y-1 text-sm max-h-60 overflow-y-auto">
                {(stripeData?.invoices ?? []).map((i: any) => (
                  <div key={i.id} className="flex items-center justify-between border-b py-1">
                    <span>{new Date(i.created * 1000).toLocaleDateString()} — {i.number}</span>
                    <span>{(i.amount_paid / 100).toFixed(2)} {i.currency?.toUpperCase()}</span>
                    <Badge variant="outline">{i.status}</Badge>
                    {i.hosted_invoice_url && <a href={i.hosted_invoice_url} target="_blank" rel="noreferrer"><ExternalLink className="h-3 w-3" /></a>}
                  </div>
                ))}
                {!stripeData?.invoices?.length && <p className="text-muted-foreground text-xs">Aucune facture</p>}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const WebhooksTab: React.FC = () => {
  const [rows, setRows] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    let q = supabase.from("stripe_webhook_events").select("*").order("created_at", { ascending: false }).limit(200);
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    const { data } = await q;
    setRows((data ?? []) as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, [statusFilter]);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="success">success</SelectItem>
            <SelectItem value="error">error</SelectItem>
            <SelectItem value="ignored">ignored</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4 mr-1" />Rafraîchir</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground border-b">
            <tr><th className="p-2">Date</th><th>Type</th><th>Statut</th><th>User</th><th>Erreur</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="p-2 text-xs">{new Date(r.created_at).toLocaleString()}</td>
                <td className="text-xs font-mono">{r.type}</td>
                <td><Badge variant={r.status === "error" ? "destructive" : r.status === "success" ? "default" : "secondary"}>{r.status}</Badge></td>
                <td className="text-xs">{r.user_id?.slice(0, 8) ?? "—"}</td>
                <td className="text-xs text-destructive">{r.error_message}</td>
              </tr>
            ))}
            {!rows.length && !loading && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Aucun événement</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const PricesTab: React.FC = () => {
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRow, setNewRow] = useState({ tier: "calmini", is_annual: false, stripe_price_id: "" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("stripe_price_mapping").select("*").order("tier").order("is_annual");
    setRows((data ?? []) as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggleActive = async (r: PriceRow) => {
    await supabase.from("stripe_price_mapping").update({ active: !r.active }).eq("id", r.id);
    load();
  };
  const remove = async (id: string) => {
    await supabase.from("stripe_price_mapping").delete().eq("id", id);
    load();
  };
  const add = async () => {
    if (!newRow.stripe_price_id) return toast.error("price_id requis");
    const { error } = await supabase.from("stripe_price_mapping").insert({ ...newRow, active: true } as any);
    if (error) return toast.error(error.message);
    setNewRow({ tier: "calmini", is_annual: false, stripe_price_id: "" });
    load();
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground border-b">
            <tr><th className="p-2">Tier</th><th>Période</th><th>Stripe price_id</th><th>Actif</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="p-2 capitalize">{r.tier}</td>
                <td>{r.is_annual ? "Annuel" : "Mensuel"}</td>
                <td className="font-mono text-xs">{r.stripe_price_id}</td>
                <td><Button size="sm" variant={r.active ? "default" : "outline"} onClick={() => toggleActive(r)}>{r.active ? "Actif" : "Inactif"}</Button></td>
                <td><Button size="sm" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t pt-4">
        <h4 className="font-semibold text-sm mb-2">Ajouter un mapping</h4>
        <div className="flex flex-wrap gap-2 items-end">
          <Select value={newRow.tier} onValueChange={(v) => setNewRow({ ...newRow, tier: v })}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{TIERS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(newRow.is_annual)} onValueChange={(v) => setNewRow({ ...newRow, is_annual: v === "true" })}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="false">Mensuel</SelectItem>
              <SelectItem value="true">Annuel</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="price_xxx" value={newRow.stripe_price_id} onChange={(e) => setNewRow({ ...newRow, stripe_price_id: e.target.value })} className="w-72 font-mono" />
          <Button onClick={add}><Plus className="h-4 w-4 mr-1" />Ajouter</Button>
        </div>
      </div>
    </Card>
  );
};

export default SuperAdmin;

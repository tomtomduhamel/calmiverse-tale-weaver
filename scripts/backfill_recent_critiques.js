import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ioeihnoxvtpxtqhxklpw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZWlobm94dnRweHRxaHhrbHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5ODQ1MzYsImV4cCI6MjA2MTU2MDUzNn0.5KolFPfnppqfb8lbYnWhJKo6GZL_VCxn3Zx1hxyLaro";
const N8N_CRITIQUE_WEBHOOK = "https://n8n.srv856374.hstgr.cloud/webhook/critique-histoire";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runBackfill(limit = 10) {
  console.log(\n🚀 [Backfill Critiques] Recherche des histoires complétées sans analyse critique (max: )...\n);

  const { data: existingCritiques, error: critErr } = await supabase
    .from('story_critiques')
    .select('story_id');

  if (critErr) {
    console.error("❌ Erreur récupération story_critiques:", critErr.message);
    return;
  }

  const evaluatedIds = new Set((existingCritiques || []).map(c => c.story_id).filter(Boolean));
  console.log(📊  histoires déjà évaluées dans la base.);

  const { data: stories, error: storiesErr } = await supabase
    .from('stories')
    .select('id, authorid, title, content, objective, childrenids, createdat')
    .eq('status', 'completed')
    .order('createdat', { ascending: false })
    .limit(limit * 3);

  if (storiesErr) {
    console.error("❌ Erreur récupération stories:", storiesErr.message);
    return;
  }

  const toEvaluate = (stories || []).filter(s => 
    !evaluatedIds.has(s.id) && 
    s.content && 
    s.content.trim().length >= 50
  ).slice(0, limit);

  if (toEvaluate.length === 0) {
    console.log("✅ Toutes les histoires récentes ont déjà été évaluées !");
    return;
  }

  console.log(📋  nouvelle(s) histoire(s) à évaluer :\n);

  let count = 0;
  for (const story of toEvaluate) {
    count++;
    console.log([/] Évaluation de «  » ()...);

    let targetAge = "4-6 ans";
    if (story.childrenids && story.childrenids.length > 0) {
      const { data: child } = await supabase
        .from('children')
        .select('birthdate')
        .eq('id', story.childrenids[0])
        .single();

      if (child?.birthdate) {
        const age = Math.floor((Date.now() - new Date(child.birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        if (age <= 2) targetAge = "0-2 ans";
        else if (age <= 4) targetAge = "2-4 ans";
        else if (age <= 7) targetAge = "4-6 ans";
        else if (age <= 12) targetAge = "8-12 ans";
        else targetAge = "13+ ans";
      }
    }

    const payload = {
      title: story.title || "Histoire sans titre",
      content: story.content.trim(),
      targetAge,
      objective: story.objective || "sleep",
      targetWordCount: 300,
      storyId: story.id,
      userId: story.authorid
    };

    try {
      const response = await fetch(N8N_CRITIQUE_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.warn(   ⚠️ Erreur HTTP  pour «  »);
        continue;
      }

      const data = await response.json();
      if (!data.success || !data.critique) {
        console.warn(   ⚠️ Réponse n8n invalide:, data.message || data);
        continue;
      }

      const critiqueData = data.critique;
      const meta = data.storyMeta || {};

      const critiqueRecord = {
        story_id: story.id,
        title: payload.title,
        content: payload.content,
        target_age: payload.targetAge,
        objective: payload.objective,
        target_word_count: payload.targetWordCount,
        actual_word_count: meta.actualWordCount || payload.content.split(/\s+/).filter(Boolean).length,
        overall_score: critiqueData.overall_score || data.score || 5.0,
        badge: data.badge || "🟡 PASSABLE",
        verdict: critiqueData.verdict_punchline || data.verdict || "Analyse complétée",
        detailed_scores: critiqueData.detailed_scores || {},
        critique_summary: critiqueData.critique_summary || {},
        strengths: critiqueData.strengths || [],
        weaknesses: critiqueData.weaknesses || [],
        calmi_pitfalls: critiqueData.calmi_pitfalls_analysis || {},
        actionable_improvements: critiqueData.actionable_improvements || [],
        rewrite_demonstration: critiqueData.rewrite_demonstration || {},
        stats: meta,
        markdown_report: data.markdownReport || "",
        evaluator_model: "gpt-4o"
      };

      const { error: insertErr } = await supabase
        .from('story_critiques')
        .insert(critiqueRecord);

      if (insertErr) {
        console.error(   ❌ Erreur insertion DB:, insertErr.message);
      } else {
        console.log(   ✨ Succès : Note /10 [] - ...);
      }

      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.error(   ❌ Exception lors de l'évaluation:, err.message);
    }
  }

  console.log(\n🎉 [Backfill Critiques] Terminé avec succès !\n);
}

runBackfill(10);

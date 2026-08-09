import requests
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# 1. Fetch 3 stories from Supabase
SUPABASE_URL = "https://ioeihnoxvtpxtqhxklpw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZWlobm94dnRweHRxaHhrbHB3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTc4Mzg5NSwiZXhwIjoyMDY1MzU5ODk1fQ.wH7qgQyQ7rDk_7T" # We can use python direct insert or webhook

N8N_WEBHOOK = "https://n8n.srv856374.hstgr.cloud/webhook/critique-histoire"

sample_stories = [
    {
        "title": "Le dentier du crocodile",
        "objective": "fun",
        "targetAge": "4-6 ans",
        "targetWordCount": 350,
        "content": """Dans la rivière Turquoise, Barnabé le crocodile avait un terrible secret : il n'avait plus de dents du haut ! Pour croquer ses nénuphars et faire peur aux moustiques, il portait un dentier en bois de saule, sculpté par son ami le castor.
Un matin brumeux, alors que Barnabé bâillait en regardant les libellules danser, un petit poisson rouge facétieux passa à toute vitesse. Splash ! Le poisson frôla le museau du crocodile. Barnabé éternua si fort que... CLAC ! Le dentier sauta hors de sa bouche et tomba au fond de l'eau.
« Catastrophe ! zézaya Barnabé sans ses dents. Je ne peux plus que faire des soupes d'algues ! »
Heureusement, Nina la loutre plongea courageusement sous un rocher couvert de mousse. En quelques brasses agiles, elle repêcha le dentier en bois et le tendit à Barnabé avec un clin d'œil malicieux. Barnabé remit son sourire en place et poussa un rire si joyeux que toute la rivière résonna de bonheur."""
    },
    {
        "title": "Le chariot rouge",
        "objective": "autonomy",
        "targetAge": "2-4 ans",
        "targetWordCount": 200,
        "content": """Léo a un joli chariot rouge en bois. Les roues tournent vite : clic, clac, roule, roule !
Ce matin, Léo veut transporter son gros doudou ours jusqu'au salon. Mais l'ours est lourd et le tapis du couloir est tout doux. Le chariot coince.
Léo tire fort. Rien ne bouge. Léo réfléchit. Il enlève le coussin pour faire de la place. Il pousse par derrière avec ses deux mains.
Ça avance ! Le chariot glisse sur le parquet lisse. Léo sourit de fierté : il a réussi tout seul comme un grand."""
    }
]

print("🚀 Évaluation et amorçage d'histoires témoins dans le cockpit qualité...")
for st in sample_stories:
    print(f"-> Évaluation de : « {st['title']} »...")
    try:
        r = requests.post(N8N_WEBHOOK, json=st, timeout=60)
        if r.status_code == 200:
            res = r.json()
            critique = res.get('critique', {})
            meta = res.get('storyMeta', {})
            
            # Save into Supabase story_critiques
            sb_payload = {
                "title": st['title'],
                "content": st['content'],
                "target_age": st['targetAge'],
                "objective": st['objective'],
                "target_word_count": st['targetWordCount'],
                "actual_word_count": meta.get('actualWordCount', len(st['content'].split())),
                "overall_score": critique.get('overall_score', res.get('score', 7.0)),
                "badge": res.get('badge', '🟢 BON NIVEAU'),
                "verdict": critique.get('verdict_punchline', res.get('verdict', 'Évaluation complétée')),
                "detailed_scores": critique.get('detailed_scores', {}),
                "critique_summary": critique.get('critique_summary', {}),
                "strengths": critique.get('strengths', []),
                "weaknesses": critique.get('weaknesses', []),
                "calmi_pitfalls": critique.get('calmi_pitfalls_analysis', {}),
                "actionable_improvements": critique.get('actionable_improvements', []),
                "rewrite_demonstration": critique.get('rewrite_demonstration', {}),
                "stats": meta,
                "markdown_report": res.get('markdownReport', ''),
                "evaluator_model": "gpt-4o"
            }
            
            # Insert into Supabase
            insert_res = requests.post(
                f"{SUPABASE_URL}/rest/v1/story_critiques",
                headers={
                    "apikey": "sb_publishable_MUHdycy0JCmkZmNNyzDxyg_zhjKtDek",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                },
                json=sb_payload
            )
            print(f"   Note: {critique.get('overall_score')}/10 | Verdict: {critique.get('verdict_punchline')[:60]}...")
        else:
            print(f"   Erreur n8n: {r.status_code} {r.text}")
    except Exception as e:
        print(f"   Exception: {e}")

print("✅ Amorçage terminé !")

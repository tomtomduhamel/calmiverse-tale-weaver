import requests
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

payload = {
    "title": "Le Secret de la Forêt Enchantée",
    "objective": "sleep",
    "targetAge": "4-6 ans",
    "targetWordCount": 250,
    "content": """Il était une fois, dans une forêt magique et merveilleuse, un petit lapin nommé Pompon. Pompon était très curieux. Tout à coup, il vit une lumière scintillante au milieu des arbres géants. Hop ! Il fit un bond. Plouf ! Il sauta dans une flaque magique. Youpi ! cria Pompon. Un vieux sage hibou apparut et lui dit : 'Bienvenue petit lapin, si tu veux grandir, tu dois toujours écouter tes parents.' Pompon comprit la grande leçon. Puis la lune monta doucement dans le ciel et Pompon s'endormit profondément. Et ils vécurent tous très heureux."""
}

print("🚀 Envoi de l'histoire au Webhook n8n...")
try:
    r = requests.post('https://n8n.srv856374.hstgr.cloud/webhook/critique-histoire', json=payload, timeout=60)
    print(f"Status HTTP: {r.status_code}")
    if r.status_code == 200:
        res = r.json()
        print("\n==========================================")
        print(f"🎯 NOTE GLOBALE : {res.get('score')}/10 — {res.get('badge')}")
        print(f"💡 VERDICT : {res.get('verdict')}")
        print("==========================================\n")
        print("📜 RAPPORT MARKDOWN COMPLET :\n")
        print(res.get('markdownReport'))
    else:
        print(f"❌ Erreur {r.status_code}: {r.text}")
except Exception as e:
    print(f"💥 Exception: {e}")

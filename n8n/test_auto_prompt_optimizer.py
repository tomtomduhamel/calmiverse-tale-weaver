import requests
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

WEBHOOK_URL = "https://n8n.srv856374.hstgr.cloud/webhook/auto-optimize-prompts"

payload = {
    "objective": "sleep",
    "batchSize": 20
}

print(f"📡 Test d'appel du webhook {WEBHOOK_URL}...")
try:
    res = requests.post(WEBHOOK_URL, json=payload, timeout=60)
    print(f"Status: {res.status_code}")
    print(f"Response: {res.text[:1000]}")
except Exception as e:
    print(f"Erreur: {e}")

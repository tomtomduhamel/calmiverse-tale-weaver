import json
import requests
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

N8N_URL = "https://n8n.srv856374.hstgr.cloud/api/v1/workflows"
API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZmIwZDNjNy02YjNhLTQyZjctODA4Yi00MWVhYjIxMDYzMmYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTExODhiYzEtMmM5Yi00YzBkLWE5OWUtZmVkZDE0MjRhMjM3IiwiaWF0IjoxNzg0OTkzOTk1fQ.s9JojRXbA07Wyp3HHcwlv2e6a8Ajudk6bmk1TsXSrRo"

headers = {
    "X-N8N-API-KEY": API_KEY,
    "Content-Type": "application/json"
}

def deploy_workflow():
    with open("n8n/wf_critique_litteraire.json", "r", encoding="utf-8") as f:
        wf_data = json.load(f)

    # Check if workflow already exists
    res = requests.get(N8N_URL, headers=headers)
    if res.status_code != 200:
        print(f"❌ Erreur lors de la récupération des workflows: {res.status_code} {res.text}")
        return

    workflows = res.json().get("data", [])
    existing_wf = next((w for w in workflows if w.get("name") == wf_data.get("name")), None)

    payload = {
        "name": wf_data.get("name"),
        "nodes": wf_data.get("nodes"),
        "connections": wf_data.get("connections"),
        "settings": wf_data.get("settings", {})
    }

    if existing_wf:
        wf_id = existing_wf["id"]
        print(f"🔄 Mise à jour du workflow existant '{wf_data['name']}' (ID: {wf_id})...")
        put_res = requests.put(f"{N8N_URL}/{wf_id}", json=payload, headers=headers)
        if put_res.status_code == 200:
            print(f"✅ Workflow mis à jour avec succès sur le serveur n8n ! (ID: {wf_id})")
        else:
            print(f"❌ Échec de la mise à jour: {put_res.status_code} {put_res.text}")
    else:
        print(f"🚀 Création du nouveau workflow '{wf_data['name']}' sur n8n...")
        post_res = requests.post(N8N_URL, json=payload, headers=headers)
        if post_res.status_code in [200, 201]:
            created = post_res.json()
            print(f"✅ Workflow créé avec succès sur le serveur n8n ! (ID: {created.get('id')})")
        else:
            print(f"❌ Échec de la création: {post_res.status_code} {post_res.text}")

if __name__ == "__main__":
    deploy_workflow()

import requests
import json
import re

N8N_URL = "https://n8n.srv856374.hstgr.cloud/api/v1/workflows"
API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZmIwZDNjNy02YjNhLTQyZjctODA4Yi00MWVhYjIxMDYzMmYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTExODhiYzEtMmM5Yi00YzBkLWE5OWUtZmVkZDE0MjRhMjM3IiwiaWF0IjoxNzg0OTkzOTk1fQ.s9JojRXbA07Wyp3HHcwlv2e6a8Ajudk6bmk1TsXSrRo"

headers = {
    "X-N8N-API-KEY": API_KEY,
    "Content-Type": "application/json"
}

EMOTION_INSTRUCTION = """
---
CONSIGNES D'ÉMOTIONS AUDIO :
Pour donner du relief au livre audio, insère une des balises suivantes au tout début des paragraphes clés (une balise par changement d'ambiance) :
- [warm] : pour les moments doux, l'intro et la fin câline
- [whisper] : pour la nuit, les secrets et les chuchotements
- [excited] : pour les découvertes joyeuses et petits moments d'enthousiasme
- [mysterious] : pour l'exploration douce et les mystères
- [sleepy] : pour les 2 derniers paragraphes afin d'amener le sommeil
(Si le ton ne change pas, ne mets pas de balise).
"""

WORKFLOW_IDS = [
    "ELHHH65cZrtgl89v",  # Histoire avec choix du titre
    "dtWweE6LiA2O2Lg3",  # Histoire (CVA) avec choix du titre
    "I4ryYCoHYuZ9rX2E",  # Histoire chatbot - V6 (Correction Mémoire)
    "SHWM52QuS3v8RHQU",  # Continue l'histoire
    "inuAiqQJf0ja11iA"   # Création histoires optimisée
]

allowed_settings = {
    'executionOrder', 'callerPolicy', 'executionTimeout', 
    'saveExecutionProgress', 'saveManualExecutions', 
    'saveDataErrorExecution', 'saveDataSuccessExecution', 
    'errorWorkflow', 'timezone'
}

def process_workflow(wf_id):
    print(f"\nFetching workflow {wf_id}...")
    res = requests.get(f"{N8N_URL}/{wf_id}", headers=headers)
    if res.status_code != 200:
        print(f"Failed to fetch workflow {wf_id}: {res.status_code} {res.text}")
        return False

    wf = res.json()
    nodes = wf.get("nodes", [])
    updated_nodes = 0

    for node in nodes:
        node_name = node.get("name", "")
        # Update LLM prompt text in generation nodes
        if any(keyword in node_name.lower() for keyword in ["création histoire", "creation histoire", "generate & analyze", "allonge"]):
            if "parameters" in node and "text" in node["parameters"]:
                text = node["parameters"]["text"]
                if isinstance(text, str) and "CONSIGNES D'ÉMOTIONS AUDIO" not in text:
                    node["parameters"]["text"] = text + "\n" + EMOTION_INSTRUCTION
                    updated_nodes += 1
                    print(f"  + Added emotion instructions to node '{node_name}'")

        # Update assignment nodes for DB saving to clean tags
        if "histoire finale" in node_name.lower() or "edit field" in node_name.lower():
            assignments = node.get("parameters", {}).get("assignments", {}).get("assignments", [])
            for assign in assignments:
                if assign.get("name") in ["histoire_finale", "content"]:
                    val = assign.get("value", "")
                    if isinstance(val, str) and ".replace(/\\[.*?\\]/g, '')" not in val:
                        if ".histoire." in val:
                            assign["value"] = val.replace(".histoire.", ".histoire.replace(/\\[.*?\\]/g, '').")
                            updated_nodes += 1
                            print(f"  + Cleaned tags in assignment node '{node_name}'")
                        elif "[\"histoire\"]" in val:
                            assign["value"] = val.replace("[\"histoire\"]", "[\"histoire\"].replace(/\\[.*?\\]/g, '')")
                            updated_nodes += 1
                            print(f"  + Cleaned tags in assignment node '{node_name}'")

    print(f"Total node modifications for '{wf.get('name')}': {updated_nodes}")
    if updated_nodes > 0:
        clean_settings = {k: v for k, v in wf.get("settings", {}).items() if k in allowed_settings}
        payload = {
            "name": wf.get("name"),
            "nodes": nodes,
            "connections": wf.get("connections", {}),
            "settings": clean_settings
        }
        put_res = requests.put(f"{N8N_URL}/{wf_id}", json=payload, headers=headers)
        if put_res.status_code == 200:
            print(f"[OK] Successfully updated workflow '{wf.get('name')}' ({wf_id}) on n8n server!")
            return True
        else:
            print(f"[FAIL] Failed to update workflow '{wf.get('name')}': {put_res.status_code} {put_res.text}")
            return False
    else:
        print(f"[INFO] Workflow '{wf.get('name')}' is already up to date.")
        return True

def main():
    print("[START] Starting automated n8n workflow updates for emotion tags...")
    for wf_id in WORKFLOW_IDS:
        process_workflow(wf_id)
    print("\n[DONE] All workflow updates completed!")

if __name__ == "__main__":
    main()

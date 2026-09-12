import requests
import json
import re

N8N_URL = "https://n8n.srv856374.hstgr.cloud/api/v1/workflows"
API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZmIwZDNjNy02YjNhLTQyZjctODA4Yi00MWVhYjIxMDYzMmYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTExODhiYzEtMmM5Yi00YzBkLWE5OWUtZmVkZDE0MjRhMjM3IiwiaWF0IjoxNzg0OTkzOTk1fQ.s9JojRXbA07Wyp3HHcwlv2e6a8Ajudk6bmk1TsXSrRo"

headers = {
    "X-N8N-API-KEY": API_KEY,
    "Content-Type": "application/json"
}

# ─── NOUVELLES CONSIGNES D'ÉMOTIONS AUDIO ────────────────────────────────────
NEW_EMOTION_INSTRUCTION = """---
CONSIGNES D'ÉMOTIONS AUDIO :
Pour donner du relief au livre audio, insère une des balises suivantes au tout début des paragraphes clés (une balise par changement d'ambiance) :
- [warm] : ton chaleureux, rassurant et bienveillant (accueil, moments doux, fin câline)
- [excited] : rire, action vive, enthousiasme, fête (fortement recommandé pour dynamiser et conclure les histoires 'fun')
- [mysterious] : suspense léger, énigmes, curiosité (recommandé pour 'focus')
- [whisper] : confidences, secrets, chuchotements complices
- [calm] : détente, contemplation douce, bien-être en journée (recommandé pour 'relax')
- [sleepy] : voix très douce, lente et berçante — ATTENTION : la balise [sleepy] est EXCLUSIVEMENT RÉSERVÉE à l'objectif "sleep" (sommeil). INTERDICTION FORMELLE d'utiliser [sleepy] pour les objectifs "fun", "focus" ou "relax".
(Si le ton ne change pas, ne mets pas de balise)."""

# ─── NOUVEAU CADRAGE SELON L'OBJECTIF POUR LA CRÉATION INITIALE ──────────────
OBJECTIVE_FRAMING_INSTRUCTION = """---
CADRAGE STRICT SELON L'OBJECTIF :
1. Si l'objectif est "fun" (s'amuser) :
- ÉNERGIE HAUTE, RIRE ET COMÉDIE : L'histoire doit faire rire, donner le sourire et de l'énergie. Privilégie le comique de situation, les quiproquos, bêtises innocentes et rebondissements loufoques.
- POSTURE D'ACTION : Les personnages doivent impérativement commencer DEBOUT ou en PLEINE ACTIVITÉ (jamais allongés sur le carrelage, l'herbe ou le lit à respirer lentement).
- INTERDICTION ABSOLUE D'ENDORMISSEMENT : Ne jamais mentionner de lit, de sommeil, de paupières lourdes, de respiration au ventre ou d'apaisement pour la nuit. L'histoire doit s'achever sur un grand éclat de rire, une cabriole ou un moment de fête partagée.
2. Si l'objectif est "focus" (concentration) :
- Mystère captivant, énigme claire à résoudre, indices à observer, esprit de déduction actif. Dénouement valorisant la vivacité d'esprit (sans sommeil).
3. Si l'objectif est "relax" (détente) :
- Sérénité et bien-être éveillé en journée, contemplation douce SANS invitation à dormir.
4. Si l'objectif est "sleep" (sommeil) :
- Seul et unique objectif où la descente hypnotique et l'accompagnement vers le sommeil sont autorisés et recherchés."""

# ─── PROMPTS DE RELECTURE / VÉRIFICATION POLYMORPHES ─────────────────────────
def build_verification_prompt(title_expr, content_expr, objective_expr, children_expr):
    return f"""=Tu es un expert en haute rédaction littéraire pour enfants. Ton rôle est de réécrire, corriger et sublimer l'histoire brute reçue pour en maximiser la qualité stylistique, l'immersion et le respect PARFAIT de l'objectif recherché par l'enfant.

Voici les détails de l'histoire brute à transformer :
- Titre : {title_expr}
- Contenu : {content_expr}
- Objectif recherché : {objective_expr}
- Prénom(s) de(s) enfant(s) : {children_expr}

Applique strictement les consignes de rédaction et de cadrage suivantes :

1. DIRECTIVES DE "BELLE RÉDACTION" LITTÉRAIRE
- Style fluide, musical et vivant : Phrases au rythme harmonieux adapté à la lecture à voix haute.
- Vocabulaire riche et évocateur : Remplace les verbes ternes (faire, dire, voir, aller) par des verbes d'action précis.
- Sobriété élégante : Évite les adjectifs laudatifs artificiels ou clichés (comme "magique", "merveilleux", "incroyable").
- Correction grammaticale et syntaxique absolue : Corrige toutes les fautes d'orthographe, de grammaire, de ponctuation ou de répétitions involontaires.

2. CADRAGE STRICT SELON L'OBJECTIF RECHERCHÉ (CRITIQUE) :
- SI L'OBJECTIF EST "fun" (S'AMUSER) :
  * Rôle : Auteur de comédie jeunesse et d'aventures hilarantes.
  * Ambiance : Énergie haute, quiproquos loufoques, situations comiques, rebondissements dynamiques.
  * INTERDICTION FORMELLE ET ABSOLUE de toute technique d'endormissement, d'hypnose, de paupières lourdes, de lit, de bâillement, de respiration guidée sur le ventre ou d'apaisement lénifiant.
  * Les personnages ne doivent JAMAIS être allongés passivement. Ils sont debout, actifs et moteurs.
  * Dénouement : L'histoire doit se terminer impérativement par un éclat de rire communicatif, une réussite joyeuse ou une célébration dynamique.
- SI L'OBJECTIF EST "focus" (CONCENTRATION) :
  * Rôle : Conteur d'énigmes et de mystères palpitants.
  * Ambiance : Clarté d'esprit, sens de l'observation, indices à repérer, suspense bienveillant. Dénouement valorisant la réflexion (sans sommeil).
- SI L'OBJECTIF EST "relax" (DÉTENTE) :
  * Rôle : Conteur de sérénité et de bien-être en journée.
  * Ambiance : Contemplation douce, paysages chaleureux et respiration naturelle SANS obligation de s'endormir.
- SI L'OBJECTIF EST "sleep" (SOMMEIL) :
  * Rôle : Praticien en accompagnement doux du sommeil et hypnose ericksonienne pédiatrique.
  * Ambiance : Ralentissement progressif du rythme, métaphores de cocon moelleux, respiration lente et endormissement paisible.

3. CONTRAINTES DE FORMAT ET DE STRUCTURE (CRITIQUES)
- Retourne UNIQUEMENT un objet JSON contenant la clé "histoire" (ex: {{ "histoire": "Le texte réécrit..." }}).
- Ne mets aucune introduction, aucune conclusion, aucun commentaire en dehors de ce JSON.
- N'écris pas le titre au début du texte.
- Ne mets pas de mot "Fin" ou de noms de sections (début/développement/fin) dans le texte.
- Le texte doit se terminer naturellement par les derniers mots de l'histoire.
- ATTENTION : La variable de sortie dans le JSON doit s'appeler "histoire" et SURTOUT PAS "story"."""

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

def update_node_emotions_and_framing(node):
    """Met à jour les consignes d'émotions et le cadrage dans les nœuds de génération"""
    name = node.get("name", "")
    params = node.get("parameters", {})
    text = params.get("text", "")
    
    if not isinstance(text, str):
        return False
        
    modified = False
    
    # 1. Remplacement des anciennes consignes d'émotions audio
    old_emotion_pattern = r"---?\s*CONSIGNES D'ÉMOTIONS AUDIO\s*:.*?\(Si le ton ne change pas, ne mets pas de balise\)\.?"
    if re.search(old_emotion_pattern, text, re.DOTALL):
        text = re.sub(old_emotion_pattern, NEW_EMOTION_INSTRUCTION, text, flags=re.DOTALL)
        modified = True
    elif "CONSIGNES D'ÉMOTIONS AUDIO" not in text and any(k in name.lower() for k in ["création histoire", "creation histoire", "generate & analyze"]):
        text = text + "\n\n" + NEW_EMOTION_INSTRUCTION
        modified = True
        
    # 2. Ajout du cadrage selon l'objectif si pas déjà présent
    if any(k in name.lower() for k in ["création histoire", "creation histoire"]) and "CADRAGE STRICT SELON L'OBJECTIF" not in text:
        text = text + "\n\n" + OBJECTIVE_FRAMING_INSTRUCTION
        modified = True
        
    if modified:
        node["parameters"]["text"] = text
        return True
    return False

def update_workflow(wf_id):
    print(f"\nTraitement du workflow {wf_id}...")
    res = requests.get(f"{N8N_URL}/{wf_id}", headers=headers)
    if res.status_code != 200:
        print(f"Échec de récupération {wf_id}: {res.status_code}")
        return False
        
    wf = res.json()
    nodes = wf.get("nodes", [])
    updated_count = 0
    
    for node in nodes:
        name = node.get("name", "")
        name_lower = name.lower()
        
        # 1. Nœuds de génération initiale
        if any(k in name_lower for k in ["création histoire", "creation histoire", "generate & analyze"]):
            if update_node_emotions_and_framing(node):
                updated_count += 1
                print(f"  + Mis à jour émotions et cadrage objectif dans: '{name}'")
                
        # 2. Nœuds d'allongement
        if "allonge" in name_lower:
            messages = node.get("parameters", {}).get("messages", {}).get("values", [])
            for msg in messages:
                c = msg.get("content", "")
                if isinstance(c, str) and "Respecte scrupuleusement l'objectif" not in c:
                    msg["content"] = c + "\n\nIMPORTANT : Respecte scrupuleusement l'objectif de l'histoire. Si l'objectif est \"fun\", n'ajoute que des péripéties comiques et rythmées, et n'ajoute JAMAIS de scène d'endormissement ou d'apaisement pour le coucher."
                    updated_count += 1
                    print(f"  + Ajout consigne anti-sommeil dans: '{name}'")
                    
        # 3. Nœuds de vérification/réécriture spécifiques
        if "vérif création histoire2" in name_lower or "verif creation histoire2" in name_lower:
            messages = node.get("parameters", {}).get("messages", {}).get("values", [])
            if messages:
                messages[0]["content"] = build_verification_prompt(
                    "{{ $json.title }}",
                    "{{ $json.content }}",
                    "{{ $('Webhook1').item.json.body.objective }}",
                    "{{ $('Webhook1').item.json.body.childrenNames }}"
                )
                updated_count += 1
                print(f"  + Polymorphisme d'objectif injecté dans: '{name}'")
                
        elif "vérif création histoire3" in name_lower or "verif creation histoire3" in name_lower:
            messages = node.get("parameters", {}).get("messages", {}).get("values", [])
            if messages:
                messages[0]["content"] = build_verification_prompt(
                    "{{ $('extraction_validation4').item.json.title }}",
                    "{{ $json.choices[0].message.content }}",
                    "{{ $('Webhook1').item.json.body.objective }}",
                    "{{ $('Webhook1').item.json.body.childrenNames }}"
                )
                updated_count += 1
                print(f"  + Polymorphisme d'objectif injecté dans: '{name}'")

        elif name in ["Vérif création histoire", "Vérif création histoire1"] and wf_id == "ELHHH65cZrtgl89v":
            messages = node.get("parameters", {}).get("messages", {}).get("values", [])
            if messages:
                messages[0]["content"] = build_verification_prompt(
                    "{{ $json.title }}",
                    "{{ $json.content }}",
                    "{{ $('Webhook').item.json.body.objective }}",
                    "{{ $('Webhook').item.json.body.childrenNames }}"
                )
                updated_count += 1
                print(f"  + Polymorphisme d'objectif injecté dans: '{name}'")

        # 4. Nœuds de description d'image (retirer 'conte hypnotique')
        if "analyze" in name_lower and "image" in name_lower:
            text = node.get("parameters", {}).get("text", "")
            if isinstance(text, str) and "conte hypnotique" in text:
                node["parameters"]["text"] = text.replace("conte hypnotique pour enfants", "histoire pour enfants")
                updated_count += 1
                print(f"  + Remplacement 'conte hypnotique' -> 'histoire' dans: '{name}'")

    print(f"Total de modifications pour '{wf.get('name')}': {updated_count}")
    if updated_count > 0:
        clean_settings = {k: v for k, v in wf.get("settings", {}).items() if k in allowed_settings}
        payload = {
            "name": wf.get("name"),
            "nodes": nodes,
            "connections": wf.get("connections", {}),
            "settings": clean_settings
        }
        put_res = requests.put(f"{N8N_URL}/{wf_id}", json=payload, headers=headers)
        if put_res.status_code == 200:
            print(f"  -> [SUCCÈS] Workflow '{wf.get('name')}' ({wf_id}) mis à jour sur le serveur n8n !")
            return True
        else:
            print(f"  -> [ERREUR] Échec mise à jour {wf_id}: {put_res.status_code} {put_res.text}")
            return False
    else:
        print(f"  -> Aucune modification nécessaire pour '{wf.get('name')}'.")
        return True

def main():
    print("[DÉMARRAGE] Mise à jour des workflows n8n pour cadrage strict des thèmes...")
    successes = 0
    for wf_id in WORKFLOW_IDS:
        if update_workflow(wf_id):
            successes += 1
    print(f"\n[FIN] {successes}/{len(WORKFLOW_IDS)} workflows traités avec succès.")

if __name__ == "__main__":
    main()

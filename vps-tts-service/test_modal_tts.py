import sys
import time
import requests

def test_modal_endpoint(url: str):
    print(f"[TEST] Inference audio GPU sur Modal : {url}")
    
    sample_text = (
        "Il etait une fois, au coeur d'une foret magique bordee d'etoiles scintillantes, "
        "un petit renard prenomme Calmi. [warm] Calmi adorait ecouter le murmure du vent du soir. "
        "Chaque nuit, il s'allongeait sous le grand chene centenaire et fermait doucement les yeux, "
        "pret a voyager dans le monde des reves merveilleux."
    )
    
    payload = {
        "text": sample_text,
        "language": "fr",
        "instruct": "Warm, gentle bedtime story narrator for children",
        "sentence_pause_ms": 250,
        "paragraph_pause_ms": 1000,
        "enable_sleep_pacing": True
    }
    
    print("[WAIT] Envoi de la requete de synthese au GPU Modal...")
    start_time = time.time()
    
    try:
        response = requests.post(url, json=payload, timeout=300)
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            output_filename = "test_calmi_modal_gpu.wav"
            with open(output_filename, "wb") as f:
                f.write(response.content)
            print(f"[SUCCESS] Audio genere sur GPU en {elapsed:.2f} secondes !")
            print(f"[FILE] Fichier audio sauvegarde sous : {output_filename} ({len(response.content) / 1024:.1f} KB)")
        else:
            print(f"[ERROR] Erreur HTTP {response.status_code} : {response.text}")
    except Exception as e:
        print(f"[EXCEPTION] Erreur lors de la requete : {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        modal_url = sys.argv[1]
    else:
        modal_url = input("Entrez l'URL Modal de votre endpoint /synthesize : ").strip()
    
    test_modal_endpoint(modal_url)

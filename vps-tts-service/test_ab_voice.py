#!/usr/bin/env python3
"""
Script de Test A/B et Évaluation de Voix de Référence pour Calmi (Qwen3-TTS)
Permet de tester 1 ou 2 échantillons vocaux de référence sur 3 phrases neutres standard
afin d'évaluer la qualité de la prosodie et du timbre en ~3 minutes avant de lancer un livre audio complet.

Usage:
  python test_ab_voice.py --ref-a path/to/sample_a.wav --text-a "Exact transcript A" [--ref-b path/to/sample_b.wav --text-b "Exact transcript B"]
"""

import os
import sys
import time
import argparse
import numpy as np
import soundfile as sf
import requests

SERVER_URL = os.getenv("TTS_SERVER_URL", "http://127.0.0.1:8000")
API_KEY = os.getenv("TTS_API_KEY", "calmi_secure_token_change_me")

NEUTRAL_BENCHMARK_SENTENCES = [
    "La journée touche à sa fin et le calme s'installe doucement dans la maison.",
    "Les étoiles s'allument une à une dans le ciel profond de la nuit.",
    "Ferme les yeux, respire profondément et laisse-toi guider par cette histoire."
]

DEFAULT_INSTRUCT = "Calm, soothing, warm bedtime storyteller for children. Soft, gentle pace."

def evaluate_audio_signal(wav: np.ndarray, sr: int):
    duration_sec = len(wav) / float(sr)
    rms = float(np.sqrt(np.mean(np.square(wav))))
    rms_db = 20 * np.log10(rms + 1e-9)
    return duration_sec, rms_db

def run_ab_test(ref_audio_path: str, ref_text: str, output_wav: str, instruct: str = DEFAULT_INSTRUCT):
    print(f"\n==================================================")
    print(f"🎙️  TEST ÉCHANTILLON VOCAL: {os.path.basename(ref_audio_path)}")
    print(f"📁 Fichier : {ref_audio_path}")
    print(f"📝 Ref Text: \"{ref_text}\"")
    print(f"🎭 Instruct: \"{instruct}\"")
    print(f"==================================================")

    if not os.path.exists(ref_audio_path):
        print(f"❌ Erreur: Le fichier d'échantillon {ref_audio_path} n'existe pas.")
        return False

    try:
        data, samplerate = sf.read(ref_audio_path)
        dur = len(data) / float(samplerate)
        print(f"ℹ️  Échantillon fourni : Durée = {dur:.2f}s | SampleRate = {samplerate} Hz")
        if dur < 3.0 or dur > 20.0:
            print(f"⚠️  Attention: La durée recommandée est de 5 à 15s (Actuelle: {dur:.1f}s).")
    except Exception as e:
        print(f"⚠️  Analyse fichier local : {e}")

    full_text = " ".join(NEUTRAL_BENCHMARK_SENTENCES)
    
    headers = {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    }

    payload = {
        "text": full_text,
        "voice_ref_url": ref_audio_path,
        "ref_text": ref_text,
        "instruct": instruct,
        "language": "French"
    }

    print(f"⚡ Envoi de la requête de synthèse au microservice ({SERVER_URL}/synthesize)...")
    start_time = time.time()

    try:
        res = requests.post(f"{SERVER_URL}/synthesize", json=payload, headers=headers, timeout=120)
        if res.status_code == 200:
            with open(output_wav, "wb") as out_f:
                out_f.write(res.content)
            
            elapsed = time.time() - start_time
            out_data, out_sr = sf.read(output_wav)
            out_dur, out_rms_db = evaluate_audio_signal(out_data, out_sr)
            
            print(f"✅ Génération réussie en {elapsed:.2f}s !")
            print(f"📊 Fichier généré : {output_wav}")
            print(f"   - Durée : {out_dur:.2f}s")
            print(f"   - Niveau sonore moyen : {out_rms_db:.1f} dB")
            return True
        else:
            print(f"❌ Échec de la synthèse HTTP {res.status_code}: {res.text}")
            return False
    except Exception as err:
        print(f"💥 Erreur de connexion au serveur TTS : {err}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test A/B rapide d'échantillon vocal pour Calmi Qwen3-TTS")
    parser.add_argument("--ref", required=True, help="Chemin vers le fichier WAV de référence (5-15s)")
    parser.add_argument("--text", required=True, help="Transcription mot-pour-mot de l'échantillon")
    parser.add_argument("--out", default="test_ab_output.wav", help="Nom du fichier WAV de sortie")
    parser.add_argument("--instruct", default=DEFAULT_INSTRUCT, help="Direction d'acteur vocale en anglais")

    args = parser.parse_args()
    run_ab_test(args.ref, args.text, args.out, args.instruct)

import time
import torch
from qwen_tts import Qwen3TTSModel
import urllib.request
import os

print("🚀 Starting local benchmark of Qwen3-TTS on VPS CPU...")

# Optimizations
torch.set_num_threads(2)
torch.set_num_interop_threads(2)

MODEL_NAME = "Qwen/Qwen3-TTS-12Hz-0.6B-Base"

print(f"📦 Loading model {MODEL_NAME}...")
start = time.time()
model = Qwen3TTSModel.from_pretrained(
    MODEL_NAME,
    device_map="cpu",
    dtype=torch.float32
)
print(f"✅ Model loaded in {time.time() - start:.2f}s")

# Download a tiny reference audio file if it doesn't exist
ref_url = "https://ioeihnoxvtpxtqhxklpw.supabase.co/storage/v1/object/public/voice-clones/thomas.wav"
ref_path = "temp_ref.wav"

if not os.path.exists(ref_path):
    print(f"📥 Downloading reference audio from: {ref_url}")
    try:
        urllib.request.urlretrieve(ref_url, ref_path)
        print("✅ Download successful!")
    except Exception as e:
        print(f"❌ Download failed: {e}. Creating a dummy file...")
        # create a dummy wav file if download fails
        import numpy as np
        import soundfile as sf
        sf.write(ref_path, np.zeros(16000 * 3), 16000)

texts_to_test = [
    "Bonjour.",  # 8 chars
    "Bonjour, c'est un test de vitesse de génération vocale.",  # 54 chars
]

for idx, text in enumerate(texts_to_test):
    print(f"\n⚡ Test {idx + 1}: Generating audio for '{text}' ({len(text)} chars)...")
    start_inf = time.time()
    try:
        wavs, sr = model.generate_voice_clone(
            text=text,
            language="French",
            ref_audio=ref_path,
            ref_text="Bienvenue dans Calmi"
        )
        print(f"🎉 Success! Generated in {time.time() - start_inf:.2f}s!")
    except Exception as e:
        print(f"💥 Failed: {e}")

# Clean up
if os.path.exists(ref_path):
    os.remove(ref_path)

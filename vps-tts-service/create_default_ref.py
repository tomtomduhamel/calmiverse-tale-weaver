import wave
import struct
import math
import os

sr = 24000
duration = 3.0
num_samples = int(sr * duration)
frequency = 440.0

output_path = os.path.join(os.path.dirname(__file__), "default_ref.wav")

with wave.open(output_path, 'w') as wav_file:
    wav_file.setnchannels(1)  # mono
    wav_file.setsampwidth(2)  # 16-bit
    wav_file.setframerate(sr)
    
    for i in range(num_samples):
        value = int(32767.0 * 0.1 * math.sin(2.0 * math.pi * frequency * i / sr))
        data = struct.pack('<h', value)
        wav_file.writeframesraw(data)

print(f"Fichier WAV de reference local cree : {output_path}")

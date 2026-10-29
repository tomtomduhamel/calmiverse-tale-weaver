# Standards TTS CosyVoice 2, Cache Audio & Lecteur Mobile - Calmiverse (v2.0)

Ce document consigne les règles critiques d'ingénierie apprises lors de la résolution des problèmes de synthèse vocale (« langue des Minions » / effondrement d'attention), de timeouts HTTP, de synchronisation MediaSession Android et de responsive mobile sur le lecteur `IntegratedAudioDeck`.

---

## 1. Moteur TTS CosyVoice 2 (`vps-tts-service/modal_app.py`)

### Règle n°1 : Fenêtre d'attention stricte (≤ 200 caractères par passe LLM) & `text_frontend=True`
- **Problème identifié (« Langue des Minions » / Babillage)** :
  - Dans `cosyvoice2-eu`, la méthode `Cosy2EU.tts(text, prompt, speed=1.0, text_frontend=False)` désactive par défaut `text_frontend`.
  - Lorsque `text_frontend=False`, `CosyVoiceFrontEnd.text_normalize()` court-circuite complètement la normalisation linguistique française et le découpage en phrases (`token_max_n=80`).
  - Le modèle `CosyVoice2-0.5B-EU` (`Qwen2LM` unistream) possède un horizon d'attention strict d'environ **60 à 80 tokens par passe** (~180 à 220 caractères). Si on lui injecte un bloc brut de 400 à 1 100 caractères d'un seul tenant, sa matrice d'attention s'effondre : il saute des phrases ou génère un charabia pseudo-français (*« Il au poujeur, dédé podeu de deux... »*).
- **Règle absolue** :
  1. **Ne jamais envoyer un paragraphe entier (> 220 caractères) en une seule passe au LLM de CosyVoice 2.**
  2. Toujours découper chaque paragraphe en phrases courtes et naturelles (`split_into_clean_sentences`, `max_sentence_chars=200`) et activer `frontend.text_normalize(sent, split=True, text_frontend=True)` pour convertir les nombres/symboles en français et garantir `< 80` tokens par segment.

### Règle n°2 : Mise en cache GPU de l'empreinte vocale (`self.speaker_cache`)
- **Problème identifié (Lenteur de `cosy_model.tts()` sur phrases courtes)** :
  - L'appel naïf à `cosy_model.tts(text, prompt)` recharge le fichier WAV à 16 kHz et ré-exécute deux modèles ONNX lourds (`speech_tokenizer_v2.onnx` Whisper + `campplus.onnx`) ainsi que l'extraction Mel à **chaque phrase** (~3,5 secondes d'overhead fixe perdues par phrase, soit > 3 minutes perdues sur 60 phrases).
  - De plus, `frontend_cross_lingual` dans `cosyvoice` supprime des clés (`del model_input['prompt_text']`) directement par effet de bord dans `spk2info[zero_shot_spk_id]`, ce qui provoque un `KeyError` dès la 2e phrase si l'on utilise `zero_shot_spk_id` nativement.
- **Règle absolue** :
  1. Extraire les tenseurs de conditionnement vocal (`flow_prompt_speech_token`, `prompt_speech_feat`, `llm_embedding`, `flow_embedding`) **une seule fois par voix** via `_get_speaker_conditioning(prompt_path)` et les conserver dans `self.speaker_cache[prompt_path]`.
  2. Tronquer l'audio de référence à **8 secondes maximum** (`16000 * 8` échantillons) pour éviter d'alourdir l'attention du décodeur Flow Matching sur chaque phrase.
  3. À chaque phrase, cloner superficiellement le dictionnaire (`{**spk_cond, 'text': tts_text_token, 'text_len': tts_text_token_len}`) et appeler directement `model.tts(**model_input, stream=False, speed=1.0)`.
  4. **Interdiction du « Chunk 0 Fast-Play » partiel** : Ne jamais téléverser un premier fragment de 18 secondes sur la même ligne `audio_files` avec `status = 'ready'`, car le frontend met immédiatement ce fragment en cache IndexedDB et l'utilisateur n'entend que 18 secondes d'histoire.

### Règle n°3 : Architecture Fast-Gateway Asynchrone (< 500 ms)
- Toutes les requêtes TTS (`get-tts-config`) doivent cibler le **CPU Fast-Gateway** (`synthesize_async_fast`), qui répond `HTTP 202 Accepted` en `< 500 ms` et délègue par `.spawn()` au worker GPU `CalmiTTSGPU.process_async_task`, éliminant définitivement les timeouts de cold-start GPU et de passerelle n8n/Supabase.

---

## 2. Lecteur Audio (`IntegratedAudioDeck.tsx`) & Synchronisation Mobile

### Règle n°4 : Synchronisation Bidirectionnelle HTMLAudioElement ↔ État React / MediaSession Android
- **Problème identifié** :
  - Sur mobile (Android/iOS), le démarrage de `audio.play()` après plusieurs appels asynchrones (`audioCache.get()`, `getSignedAudioUrl()`) ou l'interaction via le centre de notifications OS peut désynchroniser l'état React `isPlaying` (qui reste à `false` avec l'icône `▶`) alors que l'élément natif `HTMLAudioElement` joue réellement.
  - Si `handlePlayPause` vérifie uniquement `if (isPlaying && audioRef.current)`, appuyer sur le bouton vert pendant la lecture relance `audio.play()` au lieu de mettre en pause (`audio.pause()`).
- **Règle absolue** :
  1. Toujours vérifier l'état réel du lecteur DOM en priorité :
     `const isNativeAudioPlaying = Boolean(audioRef.current && !audioRef.current.paused && !audioRef.current.ended && audioRef.current.currentTime > 0);`
     Si `isPlaying || isNativeAudioPlaying`, appeler `audioRef.current.pause()` immédiatement.
  2. Attacher systématiquement `audio.onplay = () => setIsPlaying(true)` et `audio.onpause = () => { if (!audio.ended) setIsPlaying(false); }` pour synchroniser l'interface Calmi avec les contrôles matériels et la notification système Android/iOS.
  3. Protéger la phase d'initialisation asynchrone avec un verrou `isStartingPlaybackRef` pour empêcher les lancements concurrents au double-clic.

### Règle n°5 : Classes Tailwind Valides & Flexbox Mobile sur la Capsule Flottante
- **Problème identifié** :
  - L'utilisation de classes non définies dans l'échelle Tailwind par défaut (`h-8.5`, `w-8.5`, `h-13`) sur un composant `Button size="icon"` est ignorée par le CSS et laisse le bouton à sa taille par défaut (`h-10 w-10` = 40px), provoquant une troncature des icônes de droite (`✓` et `🌙`) sur les écrans mobiles de 320px–375px.
- **Règle absolue** :
  1. Utiliser exclusivement des classes d'espacement Tailwind standards (`h-8 w-8 sm:h-9 sm:w-9`) ou des valeurs arbitraires explicites (`h-[52px]`).
  2. Appliquer `min-w-0 flex-shrink` sur le sélecteur de voix à gauche avec une troncature adaptative (`max-w-[68px] xs:max-w-[85px] sm:max-w-[130px] truncate`) et `shrink-0` sur les contrôles centraux et les icônes de droite.

### Règle n°6 : Versionnement et Validation de Taille du Cache Audio IndexedDB (`audioCache.ts`)
- La clé de cache IndexedDB doit toujours inclure le nom de fichier unique généré (`getAudioCacheKey(storyId, audioUrl)`).
- Toute lecture ou écriture dans `audioCache` doit vérifier que `blob.size` est cohérent avec `expectedSize` (≥ 90 %) et supérieur à 1 024 octets afin d'auto-purger tout fichier tronqué ou corrompu.

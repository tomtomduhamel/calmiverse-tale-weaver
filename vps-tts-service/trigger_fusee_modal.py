import time
import requests

MODAL_ASYNC_URL = "https://tomtom-duhamel--calmi-tts-service-calmittsgpu-synthesize-async.modal.run"
STORY_ID = "dbc09ecf-29bf-47fd-8a67-f6c2e3ba352a"
WEBHOOK_ID = "b5c1a82f-5374-4b51-9311-64d88e409ce2"
MAMIE_VOICE_URL = "https://ioeihnoxvtpxtqhxklpw.supabase.co/storage/v1/object/public/voice-clones/59d2c73c-673c-4022-8f0e-a74d23975560/3788ec01-c177-45ff-a893-ec194bb560bf.webm"
MAMIE_REF_TEXT = "Coucou mon chéri, installe-toi bien chaudement. Papy et Mamie sont là pour te faire voyager dans un monde plein de magie et d'aventures ce soir. Laisse mon histoire t'envelopper comme un doux câlin..."

# Récupération du texte de l'histoire depuis Supabase
import json
import urllib.request

SUPABASE_REST_URL = "https://ioeihnoxvtpxtqhxklpw.supabase.co/rest/v1/stories?id=eq.dbc09ecf-29bf-47fd-8a67-f6c2e3ba352a&select=content,title"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZWlobm94dnRweHRxaHhrbHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NTY0OTEsImV4cCI6MjA2NDUzMjQ5MX0.g0aKsk7fNfI73EskfT0w7H8Z0jIu6Rj6i_V502iQd28" # standard anon key / or load direct content

story_text = """Ce matin-là, la lumière s'étirait en rubans dorés sur la paille. Gustave, Joseph, Mami Onix, Papi Onix et Boubou s'éveillèrent avec le poulailler encore tiède et le parfum ancien du foin, comme une tisane qui infuse doucement. Ils entrèrent pour déposer le grain, mais à la place du seau, quelque chose de rouge et de jaune se tenait planté là, comme une coiffure qui aurait oublié son propriétaire. Trois petites fenêtres clignotaient comme des yeux curieux, une porte minuscule respirait auprès d'un gros bouton sur lequel on lisait : "Ne pas toucher avec un bec." Peut-être que, en regardant, tu peux sentir le léger frisson d'aventure qui coule entre les planches.

Gustave désigna le bouton d'un doigt tranquille. Joseph leva la tête vers le toit, les idées qui flottent comme des nuages : peut-être qu'elle était tombée du ciel. À cet instant, Gertrude, la grosse poule, sauta sur le bouton avec ses deux pattes. La fusée souffla : "Pschitt !" Les portes s'ouvrirent comme un sourire, et toutes les poules glissèrent à l'intérieur, pressées, curieuses, comme des étoiles qui se serrent dans une poche.

Mami Onix courut attraper son tablier aux mille poches. "Une poule dans une fusée, ça se rattrape avec des idées", murmura-t-elle en souriant. Papi Onix coiffa son vieux chapeau, prit sa louche comme un gouvernail. Boubou aboya et bondit vers la fusée ; Gertrude passa la tête par une fenêtre et, coquine, lui posa une plume sur le nez. Joseph montait sur une caisse pour mieux contempler ; Gustave dénicha une longue ficelle et, doucement, ils firent une boucle autour de la patte de la fusée, comme on enlace une branche. Papi accrocha l'autre extrémité au tracteur. Mami Onix prit le volant ; Boubou se plaça devant, très fier, comme s'il avait appris à diriger le vent lui-même.

Mais Gertrude, toujours pressée, appuya encore sur le bouton avec l'aile. La fusée bondit, tira le tracteur, entraîna Mami Onix, Papi Onix qui tenait encore sa louche, et fit glisser toute l'équipe jusqu'au potager. Les tomates frissonnèrent sur leurs tiges, les salades s'aplatirent comme des draps au vent. Boubou courait derrière, les pattes qui tapaient la terre, essayant d'attraper la ficelle. Le vent semblait respirer avec eux, inspirer, expirer, et tu peux, si tu veux, laisser ton souffle suivre ce rythme lent, calme et régulier.

La fusée s'arrêta net devant l'épouvantail, comme si elle avait reçu une consigne. Sur son ventre, un petit écran clignotait en lettres patientes : "Carburant : maïs." Joseph eut un petit saut de joie : "Ah ! Les poules veulent du maïs pour décoller !" Gustave plissa les yeux, attentif à la douce logique des choses. "Elles ne décolleront pas en dévorant tout le jardin."

Papi Onix contempla son tracteur parsemé de feuilles. "D'accord. On leur donne du faux maïs." Mami Onix ouvrit ses poches et sortit une collection jaune : bouchons, billes, un ruban en spirale, une vieille chaussette éclatante comme un soleil timide. "J'ai de quoi faire croire n'importe quoi à une poule pressée," souffla-t-elle, en arrangeant chaque objet comme on compose une petite musique.

Les cinq héros bâtirent une montagne jaune dans une bassine. Gustave lança les bouchons, Joseph ajouta les billes, Mami Onix roula le ruban en spirale, Papi posa la chaussette au sommet. Boubou remua la bassine d'une patte, recula en éternuant parce qu'une plume le chatouillait. Gertrude sortit de la fusée, suivie de six poules curieuses. Elle pencha la tête, observa la pile jaune, avala un bouchon ; fit une drôle de figure ; puis avala une bille. La bille ressortit aussitôt par la petite porte et roula sous le tracteur comme une lune qui s'échappe.

La fusée se mit à tourner sur elle-même, étonnée et déçue. Papi Onix s'exclama : "Ce n'est pas du carburant, c'est du bazar !" La porte claqua et, un à un, les oiseaux furent projetés sur des tas de paille, retombant avec un petit bruit de feuilles. Gertrude atterrit sur le chapeau de Papi Onix ; une autre trouva refuge dans la poche de Mami Onix ; une troisième grimpa sur le dos de Boubou et y resta, comme si elle portait un capitaine.

Gustave aperçut sous la fusée une étiquette laissée comme une note : "Jouet de la Foire aux inventions. Fonctionne avec trois épis de maïs." Joseph bondit : "Il faut donner du vrai maïs, mais seulement trois épis !" Mami Onix s'éloigna, revint avec trois épis bien droits, l'odeur douce et chaude du champs séché, et Gustave les glissa dans une petite trappe. Joseph referma avec soin. Papi retira la ficelle. Boubou éloigna Gertrude du bouton en lui proposant une friandise pour chien, geste qui vexa la poule mais qui calma un instant le tumulte.

La fusée leva ses petites pattes, fit un minuscule saut et se posa derrière le poulailler, comme si elle retrouvait sa place. Une porte s'entrouvrit et elle distribua, avec une gentillesse mécanique, trois grains de maïs à chaque poule — trois petits soleils qui tinrent la promesse du décollage. Gertrude considéra la fusée, contempla Boubou, puis, avec un petit air souverain, décida de s'installer sur le casque de Papi Onix.

On résolut de laisser un souvenir de ce jour. Mami Onix proposa un panneau : "Attention, poules astronautes." Joseph dessina une poule au casque ; Gustave esquissa une fusée à douze roues qui roulait presque en chantant ; Papi ajouta sa louche, parce qu'elle avait tenu la situation ; et Boubou reçut une médaille en carton : "Chien mécanicien." Le soir, les poules regagnèrent leur nid. La fusée resta posée, silencieuse et sage. Gertrude dormit sur le casque de Papi Onix. Gustave et Joseph rirent encore, les rires qui se prolongent comme une caresse. Mami Onix promit de surveiller le bouton rouge. Papi Onix dit, avec la dernière gravité douce : "Surtout, ne le donnez jamais à Gertrude." Derrière lui, la poule ouvrit un œil et regarda le bouton avec un air très intéressé."""

print(f"🚀 [MODAL GPU TRIGGER] Lancement de la génération pour 'Une fusée dans le poulailler' ({len(story_text)} chars)...")
print(f"🎙️ Voix : Voix de Mamie Onix ({MAMIE_VOICE_URL})")

payload = {
    "text": story_text,
    "language": "fr",
    "voice_ref_url": MAMIE_VOICE_URL,
    "ref_text": MAMIE_REF_TEXT,
    "instruct": "Warm, soothing bedtime narrator for children, gentle and peaceful storytelling voice",
    "sentence_pause_ms": 250,
    "paragraph_pause_ms": 1000,
    "chapter_pause_ms": 3000,
    "enable_sleep_pacing": True,
    "webhook_id": WEBHOOK_ID,
    "story_id": STORY_ID
}

start = time.time()
try:
    res = requests.post(MODAL_ASYNC_URL, json=payload, timeout=60)
    print(f"HTTP Status: {res.status_code} in {time.time() - start:.2f}s")
    if res.status_code == 202:
        print("✅ Requête acceptée par Modal GPU !")
        print("Réponse:", res.json())
        print("⚡ Le conteneur Modal GPU génère actuellement l'audio et va l'uploader directement sur Supabase !")
    else:
        print(f"❌ Erreur HTTP: {res.status_code} - {res.text}")
except Exception as e:
    print("💥 Exception:", e)

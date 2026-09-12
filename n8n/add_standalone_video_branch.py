import requests
import json
import uuid

N8N_URL = "https://n8n.srv856374.hstgr.cloud/api/v1/workflows/ELHHH65cZrtgl89v"
API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZmIwZDNjNy02YjNhLTQyZjctODA4Yi00MWVhYjIxMDYzMmYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTExODhiYzEtMmM5Yi00YzBkLWE5OWUtZmVkZDE0MjRhMjM3IiwiaWF0IjoxNzg0OTkzOTk1fQ.s9JojRXbA07Wyp3HHcwlv2e6a8Ajudk6bmk1TsXSrRo"

headers = {
    "X-N8N-API-KEY": API_KEY,
    "Content-Type": "application/json"
}

def update_workflow():
    # 1. Récupérer le workflow actif
    res = requests.get(N8N_URL, headers=headers)
    if res.status_code != 200:
        print(f"Erreur fetch n8n: {res.status_code} {res.text}")
        return False

    wf_data = res.json()
    nodes = wf_data.get("nodes", [])
    connections = wf_data.get("connections", {})

    print(f"Workflow récupéré: {wf_data.get('name')}, {len(nodes)} nœuds existants.")

    # 2. Vérifier si Router_action existe déjà
    existing_node_names = [n["name"] for n in nodes]
    if "Router_action" in existing_node_names:
        print("Router_action est déjà présent. Suppression des anciens nœuds standalone pour mise à jour...")
        standalone_names = [
            "Router_action",
            "Download_existing_image",
            "Analyze_image_standalone",
            "video_story_standalone",
            "Post_standalone_video_supabase",
            "Maj_standalone_story_video"
        ]
        nodes = [n for n in nodes if n["name"] not in standalone_names]
        for sname in standalone_names:
            connections.pop(sname, None)

    # 3. Définition des nouveaux nœuds
    router_node = {
        "parameters": {
            "conditions": {
                "options": {
                    "caseSensitive": True,
                    "leftValue": "",
                    "typeValidation": "strict",
                    "version": 2
                },
                "conditions": [
                    {
                        "id": str(uuid.uuid4()),
                        "leftValue": "={{ $('Webhook1').item.json.body.action }}",
                        "rightValue": "generate_video_only",
                        "operator": {
                            "type": "string",
                            "operation": "equals"
                        }
                    }
                ],
                "combinator": "and"
            },
            "options": {}
        },
        "type": "n8n-nodes-base.if",
        "typeVersion": 2.2,
        "position": [160, 112],
        "id": str(uuid.uuid4()),
        "name": "Router_action"
    }

    download_image_node = {
        "parameters": {
            "method": "GET",
            "url": "=https://ioeihnoxvtpxtqhxklpw.supabase.co/storage/v1/object/public/storyimages/{{ $('Webhook1').item.json.body.imagePath }}",
            "options": {
                "response": {
                    "response": {
                        "responseFormat": "file"
                    }
                }
            }
        },
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [450, -250],
        "id": str(uuid.uuid4()),
        "name": "Download_existing_image"
    }

    analyze_image_node = {
        "parameters": {
            "resource": "document",
            "modelId": {
                "__rl": True,
                "value": "models/gemini-3.6-flash",
                "mode": "list",
                "cachedResultName": "models/gemini-3.6-flash"
            },
            "text": "Analyse cette image de couverture d'histoire pour enfants. Rédige une description technique détaillée destinée à un générateur de vidéo (Veo). Ta réponse doit se concentrer sur :\n\nLa Palette : Couleurs dominantes et secondaires (ex: pastel, bleu nuit, doré).\n\nLa Lumière : Source et intensité (ex: lumière diffuse, rayons de lune, aquarelle douce).\n\nLe Style : Texture et médium (ex: peinture à l'huile, illustration 2D éthérée, textures de papier).\n\nL'Ambiance : (ex: onirique, sécurisante, calme).\n\nLes personnages : leur âge, leur apparence visuelle et vestimentaire, leurs émotions faciales et gestuelles.",
            "inputType": "binary",
            "options": {}
        },
        "type": "@n8n/n8n-nodes-langchain.googleGemini",
        "typeVersion": 1.1,
        "position": [800, -250],
        "id": str(uuid.uuid4()),
        "name": "Analyze_image_standalone",
        "credentials": {
            "googlePalmApi": {
                "id": "WEPi8fFtLpk1vZ6u",
                "name": "Google Gemini(PaLM) Api account 2"
            }
        },
        "onError": "continueErrorOutput"
    }

    video_story_node = {
        "parameters": {
            "resource": "video",
            "modelId": {
                "__rl": True,
                "value": "models/veo-3.1-lite-generate-preview",
                "mode": "list",
                "cachedResultName": "models/veo-3.1-lite-generate-preview"
            },
            "prompt": "=MANDATORY FORMAT: STRICT {{ ($('Webhook1').first().json?.body?.videoOrientation === 'landscape' || $('Webhook1').first().json?.body?.videoAspectRatio === '16:9') ? 'HORIZONTAL LANDSCAPE ORIENTATION ONLY (Aspect Ratio 16:9, 1920x1080). DO NOT GENERATE IN VERTICAL OR PORTRAIT FORMAT. The entire visual composition must be widescreen cinematic, designed for landscape screens.' : 'VERTICAL PORTRAIT ORIENTATION ONLY (Aspect Ratio 9:16, 1080x1920). DO NOT GENERATE IN HORIZONTAL OR LANDSCAPE FORMAT. The entire visual composition must be tall and vertical, designed for mobile smartphone screens.' }}\n\nGenerate a 5-second cinematic {{ ($('Webhook1').first().json?.body?.videoOrientation === 'landscape' || $('Webhook1').first().json?.body?.videoAspectRatio === '16:9') ? 'horizontal landscape video (16:9 widescreen)' : 'vertical video (9:16 portrait)' }}, with zero text, illustrating the story: {{ $('Webhook1').first().json?.body?.selectedTitle }}\n\nTHERAPEUTIC CONTEXT:\nThis video illustrates a hypnotic tale for children (0-10 years old) to serve as a soothing visual introduction.\n\nSTORY SUMMARY:\n{{ $('Webhook1').first().json?.body?.summary }}\n\nVISUAL DIRECTIVES AND ATMOSPHERE (Based on the cover image):\n{{ $('Analyze_image_standalone').first().json?.content?.parts?.[0]?.text || $('Analyze_image_standalone').first().json?.text || '' }}\nEnsure the video matches the visual artistic style of the cover image perfectly.\n\nTECHNICAL MOVEMENT & AUDIO SPECIFICATIONS:\n1. STRICT {{ ($('Webhook1').first().json?.body?.videoOrientation === 'landscape' || $('Webhook1').first().json?.body?.videoAspectRatio === '16:9') ? 'LANDSCAPE 16:9: Frame the entire widescreen composition horizontally.' : 'VERTICAL 9:16: Frame the entire composition vertically for mobile screen display.' }} Keep the main character or object centered.\n2. PACE: Ultra slow, gentle breathing rhythm (~50 BPM). No sudden cuts, no shaking.\n3. AUDIO & NARRATION SPEED: Any voice-over, spoken word, or narration in this video must be very slow, soft, soothing, and unhurried (calm bedtime tempo). Do NOT speak fast or rush words.\n4. ENDING DECELERATION (CRITICAL): By second 3.5, the motion smoothly slows down and completely settles into a motionless, serene resting tableau for the remainder of the video so there is no abrupt stop.\n5. TEXTURES & ATMOSPHERE: Soft light, cozy glow, soothing watercolor/storybook textures, comforting atmosphere.\n\nThe video must end in absolute stillness, peace, and reassurance.",
            "options": {
                "durationSeconds": 5,
                "aspectRatio": "={{ ($('Webhook1').first().json?.body?.videoOrientation === 'landscape' || $('Webhook1').first().json?.body?.videoAspectRatio === '16:9') ? '16:9' : '9:16' }}"
            }
        },
        "type": "@n8n/n8n-nodes-langchain.googleGemini",
        "typeVersion": 1.1,
        "position": [1150, -250],
        "id": str(uuid.uuid4()),
        "name": "video_story_standalone",
        "credentials": {
            "googlePalmApi": {
                "id": "WEPi8fFtLpk1vZ6u",
                "name": "Google Gemini(PaLM) Api account 2"
            }
        },
        "onError": "continueErrorOutput"
    }

    post_video_node = {
        "parameters": {
            "method": "POST",
            "url": "=https://ioeihnoxvtpxtqhxklpw.supabase.co/storage/v1/object/storyvideos/{{ $('Webhook1').item.json.body.storyId }}.mp4",
            "authentication": "predefinedCredentialType",
            "nodeCredentialType": "supabaseApi",
            "sendHeaders": True,
            "headerParameters": {
                "parameters": [
                    {
                        "name": "Content-Type",
                        "value": "video/mp4"
                    }
                ]
            },
            "sendBody": True,
            "contentType": "binaryData",
            "inputDataFieldName": "data",
            "options": {}
        },
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [1500, -250],
        "id": str(uuid.uuid4()),
        "name": "Post_standalone_video_supabase",
        "credentials": {
            "supabaseApi": {
                "id": "wigd9LqEY8DlWzkn",
                "name": "Supabase account"
            }
        }
    }

    patch_story_node = {
        "parameters": {
            "method": "PATCH",
            "url": "=https://ioeihnoxvtpxtqhxklpw.supabase.co/rest/v1/stories?id=eq.{{ $('Webhook1').item.json.body.storyId }}",
            "authentication": "predefinedCredentialType",
            "nodeCredentialType": "supabaseApi",
            "sendHeaders": True,
            "headerParameters": {
                "parameters": [
                    {
                        "name": "content-type",
                        "value": "application/json"
                    }
                ]
            },
            "sendBody": True,
            "bodyParameters": {
                "parameters": [
                    {
                        "name": "video_path",
                        "value": "={{ $('Webhook1').item.json.body.storyId }}.mp4"
                    }
                ]
            },
            "options": {}
        },
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [1850, -250],
        "id": str(uuid.uuid4()),
        "name": "Maj_standalone_story_video",
        "credentials": {
            "supabaseApi": {
                "id": "wigd9LqEY8DlWzkn",
                "name": "Supabase account"
            }
        }
    }

    nodes.extend([
        router_node,
        download_image_node,
        analyze_image_node,
        video_story_node,
        post_video_node,
        patch_story_node
    ])

    # 4. Câblage des connexions :
    # Webhook1 -> Router_action
    connections["Webhook1"] = {
        "main": [
            [
                {
                    "node": "Router_action",
                    "type": "main",
                    "index": 0
                }
            ]
        ]
    }

    # Router_action :
    # Output 0 (True: generate_video_only) -> Download_existing_image
    # Output 1 (False: normal story creation) -> Création histoire1
    connections["Router_action"] = {
        "main": [
            [
                {
                    "node": "Download_existing_image",
                    "type": "main",
                    "index": 0
                }
            ],
            [
                {
                    "node": "Création histoire1",
                    "type": "main",
                    "index": 0
                }
            ]
        ]
    }

    # Download_existing_image -> Analyze_image_standalone
    connections["Download_existing_image"] = {
        "main": [
            [
                {
                    "node": "Analyze_image_standalone",
                    "type": "main",
                    "index": 0
                }
            ]
        ]
    }

    # Analyze_image_standalone -> video_story_standalone
    connections["Analyze_image_standalone"] = {
        "main": [
            [
                {
                    "node": "video_story_standalone",
                    "type": "main",
                    "index": 0
                }
            ]
        ]
    }

    # video_story_standalone -> Post_standalone_video_supabase
    connections["video_story_standalone"] = {
        "main": [
            [
                {
                    "node": "Post_standalone_video_supabase",
                    "type": "main",
                    "index": 0
                }
            ]
        ]
    }

    # Post_standalone_video_supabase -> Maj_standalone_story_video
    connections["Post_standalone_video_supabase"] = {
        "main": [
            [
                {
                    "node": "Maj_standalone_story_video",
                    "type": "main",
                    "index": 0
                }
            ]
        ]
    }

    payload = {
        "name": wf_data.get("name"),
        "nodes": nodes,
        "connections": connections,
        "settings": wf_data.get("settings", {})
    }

    # Sauvegarder localement
    with open("n8n/current_wf_histoire_titre.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
    print("Fichier local n8n/current_wf_histoire_titre.json mis à jour.")

    # Déployer sur n8n
    put_res = requests.put(N8N_URL, json=payload, headers=headers)
    if put_res.status_code == 200:
        print("Déploiement réussi sur n8n !")
        return True
    else:
        print(f"Erreur lors du PUT n8n: {put_res.status_code} {put_res.text}")
        return False

if __name__ == "__main__":
    update_workflow()

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadEpub = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const cors_1 = require("../middleware/cors");
// Ajouter la vérification d'initialisation ici
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
}
const storage = admin.storage();
exports.uploadEpub = functions.https.onRequest((request, response) => {
    return (0, cors_1.corsHandler)(request, response, async () => {
        try {
            console.log('Début de la fonction uploadEpub');
            if (request.method !== 'POST') {
                console.error('Méthode non autorisée:', request.method);
                throw new functions.https.HttpsError('invalid-argument', 'Method not allowed');
            }
            console.log('Vérification du contenu de la requête');
            const { content, filename } = request.body;
            if (!content || !filename) {
                console.error('Contenu manquant:', { hasContent: !!content, hasFilename: !!filename });
                throw new functions.https.HttpsError('invalid-argument', 'Content and filename are required');
            }
            console.log('Création du buffer à partir du contenu HTML');
            const buffer = Buffer.from(content);
            console.log('Création de la référence Storage pour:', filename);
            const bucket = storage.bucket();
            const file = bucket.file(`epubs/${filename}`);
            console.log('Début de l\'upload du fichier');
            await file.save(buffer, {
                metadata: {
                    contentType: 'application/epub+zip'
                }
            });
            console.log('Fichier uploadé avec succès');
            console.log('Génération de l\'URL signée');
            const [url] = await file.getSignedUrl({
                action: 'read',
                expires: Date.now() + 7 * 24 * 60 * 60 * 1000
            });
            console.log('URL générée avec succès:', url);
            response.json({ url });
        }
        catch (error) {
            console.error('Erreur détaillée dans uploadEpub:', error);
            if (error instanceof Error) {
                console.error('Stack trace:', error.stack);
            }
            if (error instanceof functions.https.HttpsError) {
                response.status(400).json({
                    error: error.message,
                    code: error.code,
                    details: error.details
                });
            }
            else {
                response.status(500).json({
                    error: 'Failed to upload file',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    });
});
//# sourceMappingURL=uploadHandler.js.map
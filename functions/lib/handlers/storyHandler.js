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
exports.generateStory = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const cors_1 = require("../middleware/cors");
const openaiService_1 = require("../services/openaiService");
if (!admin.apps.length) {
    admin.initializeApp();
}
exports.generateStory = functions.https.onRequest((request, response) => {
    return (0, cors_1.corsHandler)(request, response, async () => {
        var _a;
        console.log('Origine de la requête:', request.headers.origin);
        console.log('Méthode de la requête:', request.method);
        // Ajout des headers CORS manuellement
        response.set('Access-Control-Allow-Origin', '*');
        response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        response.set('Access-Control-Max-Age', '3600');
        if (request.method === 'OPTIONS') {
            response.status(204).send('');
            return;
        }
        try {
            console.log('Corps de la requête:', request.body);
            if (!((_a = request.body.data) === null || _a === void 0 ? void 0 : _a.prompt)) {
                throw new functions.https.HttpsError('invalid-argument', 'Le prompt est requis');
            }
            const { objective, childrenNames } = request.body.data;
            console.log('Objectif:', objective);
            console.log('Noms des enfants:', childrenNames);
            const storyData = await (0, openaiService_1.generateStoryWithAI)(objective, childrenNames);
            console.log('Histoire générée:', storyData);
            const storyRef = admin.firestore().doc(`stories/${storyData.id_stories}`);
            await storyRef.update({
                story_text: storyData.story_text,
                story_summary: storyData.story_summary,
                status: 'completed',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            response.json({ data: storyData });
        }
        catch (error) {
            console.error('Erreur:', error);
            if (error instanceof functions.https.HttpsError) {
                response.status(400).json({
                    error: error.message,
                    code: error.code,
                    details: error.details
                });
            }
            else {
                response.status(500).json({
                    error: 'Failed to generate story',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    });
});
//# sourceMappingURL=storyHandler.js.map
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
const openaiService_1 = require("../services/openaiService");
if (!admin.apps.length) {
    admin.initializeApp();
}
const runtimeOpts = {
    timeoutSeconds: 120,
    memory: '1GB'
};
exports.generateStory = functions
    .runWith(runtimeOpts)
    .https.onCall(async (data, context) => {
    try {
        const { objective, childrenNames } = data;
        if (!objective) {
            throw new functions.https.HttpsError('invalid-argument', 'L\'objectif est requis');
        }
        if (!Array.isArray(childrenNames)) {
            throw new functions.https.HttpsError('invalid-argument', 'Les noms des enfants doivent être fournis dans un tableau');
        }
        console.log('Objectif:', objective);
        console.log('Noms des enfants:', childrenNames);
        const storyData = await (0, openaiService_1.generateStoryWithAI)(objective, childrenNames);
        console.log('Histoire générée:', storyData);
        const storyRef = admin.firestore().collection('stories').doc(storyData.id_stories);
        await storyRef.set(Object.assign(Object.assign({}, storyData), { status: 'completed', updatedAt: admin.firestore.FieldValue.serverTimestamp() }), { merge: true });
        return storyData;
    }
    catch (error) {
        console.error('Erreur:', error);
        throw new functions.https.HttpsError('internal', 'Failed to generate story', error instanceof Error ? error.message : 'Unknown error');
    }
});
//# sourceMappingURL=storyHandler.js.map
import cors from 'cors';

const allowedOrigins = [
  'https://calmi-99482.web.app',
  'https://calmi-99482.firebaseapp.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'https://id-preview--a3a7afdb-6cda-4ac0-ae38-aab4d04d9624.lovable.app'
];

export const corsHandler = cors({
  origin: (origin, callback) => {
    // Permettre les requêtes sans origine (comme les appels API directs)
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Origine non autorisée: ${origin}`);
      callback(null, true); // Temporairement autoriser toutes les origines
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  maxAge: 86400 // 24 heures
});
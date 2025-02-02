import cors from 'cors';

const allowedOrigins = [
  'https://calmi-99482.web.app',
  'https://calmi-99482.firebaseapp.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'https://id-preview--a3a7afdb-6cda-4ac0-ae38-aab4d04d9624.lovable.app',
  'https://a3a7afdb-6cda-4ac0-ae38-aab4d04d9624.lovableproject.com',
  'https://calmiverse-tale-weaver.web.app',
  '*.lovable.app',
  '*.lovableproject.com'
];

export const corsHandler = cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.startsWith('*')) {
        const domain = allowedOrigin.slice(1); // Remove *
        return origin.endsWith(domain);
      }
      return allowedOrigin === origin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`Origine non autorisée: ${origin}`);
      callback(new Error('Not allowed by CORS'));
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
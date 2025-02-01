import cors from 'cors';

export const corsHandler = cors({
  origin: true, // Permet toutes les origines en développement
  credentials: true,
  methods: ['POST', 'OPTIONS', 'GET'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  maxAge: 3600
});
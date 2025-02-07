
import cors from 'cors';

export const corsHandler = cors({
  origin: ['https://a3a7afdb-6cda-4ac0-ae38-aab4d04d9624.lovableproject.com', /\.lovableproject\.com$/, /localhost/],
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


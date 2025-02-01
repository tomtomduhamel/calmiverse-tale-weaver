import cors from 'cors';

export const corsHandler = cors({
  origin: true,
  methods: ['POST', 'OPTIONS', 'GET'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  maxAge: 3600
});
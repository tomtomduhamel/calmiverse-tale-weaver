
import cors from 'cors';

export const corsHandler = cors({
  origin: true,
  credentials: true
});

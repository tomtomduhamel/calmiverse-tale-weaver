export const generateToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const tokenLength = 32;
  let token = '';
  
  for (let i = 0; i < tokenLength; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return token;
};

export const isTokenValid = (token: string, expiresAt: Date): boolean => {
  return token.length === 32 && new Date() < expiresAt;
};
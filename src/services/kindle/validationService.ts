
export const kindleValidationService = {
  /**
   * Valide l'email Kindle
   */
  validateKindleEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      console.warn('⚠️ [KindleValidation] Email manquant ou invalide:', email);
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    console.log(`${isValid ? '✅' : '❌'} [KindleValidation] Validation email Kindle:`, {
      email,
      isValid
    });
    
    return isValid;
  }
};

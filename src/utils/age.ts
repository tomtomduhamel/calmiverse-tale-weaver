export const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export const formatAge = (age: number): string => {
  return `${age} an${age > 1 ? 's' : ''}`;
};

export const isValidBirthDate = (date: Date): boolean => {
  const today = new Date();
  const minDate = new Date();
  minDate.setFullYear(today.getFullYear() - 12);
  
  return date <= today && date >= minDate;
};
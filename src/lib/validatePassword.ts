// Password validation utility for enhanced security
export function validatePassword(password: string): void {
  const minLength = 12;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  if (password.length < minLength) {
    throw new Error(`Password must be at least ${minLength} characters long`);
  }
  
  if (!hasUpper) {
    throw new Error('Password must contain at least one uppercase letter');
  }
  
  if (!hasLower) {
    throw new Error('Password must contain at least one lowercase letter');
  }
  
  if (!hasNumber) {
    throw new Error('Password must contain at least one number');
  }
  
  if (!hasSymbol) {
    throw new Error('Password must contain at least one special character');
  }
}

export function getPasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 12) score++;
  else feedback.push('Use at least 12 characters');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Add uppercase letters');

  if (/[a-z]/.test(password)) score++;
  else feedback.push('Add lowercase letters');

  if (/\d/.test(password)) score++;
  else feedback.push('Add numbers');

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else feedback.push('Add special characters');

  if (password.length >= 16) score++;

  return { score, feedback };
}
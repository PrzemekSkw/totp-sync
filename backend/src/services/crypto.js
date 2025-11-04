const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be exactly 32 characters');
}

// Konwertuj klucz na Buffer (wymagane przez crypto)
const KEY_BUFFER = Buffer.from(ENCRYPTION_KEY, 'utf8');

/**
 * Szyfrowanie sekretu TOTP (AES-256-GCM)
 * Używa natywnego Node.js crypto zamiast CryptoJS
 */
const encryptSecret = (secret) => {
  try {
    // Walidacja secret przed szyfrowaniem (zachowana z oryginalnego kodu)
    if (!secret || typeof secret !== 'string') {
      throw new Error('Secret must be a non-empty string');
    }

    // Usuń białe znaki
    const cleanSecret = secret.trim();
    
    if (cleanSecret.length === 0) {
      throw new Error('Secret cannot be empty');
    }

    // Sprawdź czy secret nie jest zbyt długi (max 1000 znaków)
    if (cleanSecret.length > 1000) {
      throw new Error('Secret is too long (max 1000 characters)');
    }

    // Generuj losowy IV (Initialization Vector) - 16 bajtów dla AES
    const iv = crypto.randomBytes(16);
    
    // Utwórz cipher z algorytmem AES-256-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', KEY_BUFFER, iv);
    
    // Zaszyfruj dane
    let encrypted = cipher.update(cleanSecret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Pobierz tag uwierzytelnienia (GCM)
    const authTag = cipher.getAuthTag();
    
    // Zwróć: iv:authTag:encryptedData (wszystko w hex)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw error; // Rzuć oryginalny błąd zamiast nowego (zachowane z oryginału)
  }
};

/**
 * Deszyfrowanie sekretu TOTP
 * Format: iv:authTag:encryptedData
 */
const decryptSecret = (encryptedSecret) => {
  try {
    // Walidacja (zachowana z oryginalnego kodu)
    if (!encryptedSecret || typeof encryptedSecret !== 'string') {
      throw new Error('Encrypted secret must be a non-empty string');
    }

    // Rozpakuj składowe
    const parts = encryptedSecret.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    // Utwórz decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY_BUFFER, iv);
    decipher.setAuthTag(authTag);
    
    // Odszyfruj dane
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    // Walidacja (zachowana z oryginalnego kodu)
    if (!decrypted) {
      throw new Error('Decryption resulted in empty string');
    }
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw error; // Rzuć oryginalny błąd (zachowane z oryginału)
  }
};

/**
 * Hash hasła użytkownika
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

/**
 * Weryfikacja hasła
 */
const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Generowanie losowego klucza dla użytkownika (32 bajty = 64 znaki hex)
 * Zamienione z CryptoJS.lib.WordArray.random na crypto.randomBytes
 */
const generateUserKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = {
  encryptSecret,
  decryptSecret,
  hashPassword,
  verifyPassword,
  generateUserKey
};

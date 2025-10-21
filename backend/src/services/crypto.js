const CryptoJS = require('crypto-js');
const bcrypt = require('bcryptjs');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be exactly 32 characters');
}

// Szyfrowanie sekretu TOTP (AES-256)
const encryptSecret = (secret) => {
  try {
    // Walidacja secret przed szyfrowaniem
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

    const encrypted = CryptoJS.AES.encrypt(cleanSecret, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw error; // Rzuć oryginalny błąd zamiast nowego
  }
};

// Deszyfrowanie sekretu TOTP
const decryptSecret = (encryptedSecret) => {
  try {
    if (!encryptedSecret || typeof encryptedSecret !== 'string') {
      throw new Error('Encrypted secret must be a non-empty string');
    }

    const decrypted = CryptoJS.AES.decrypt(encryptedSecret, ENCRYPTION_KEY);
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString) {
      throw new Error('Decryption resulted in empty string');
    }
    
    return decryptedString;
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
};

// Hash hasła użytkownika
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

// Weryfikacja hasła
const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

// Generowanie losowego klucza dla użytkownika
const generateUserKey = () => {
  return CryptoJS.lib.WordArray.random(32).toString();
};

module.exports = {
  encryptSecret,
  decryptSecret,
  hashPassword,
  verifyPassword,
  generateUserKey
};

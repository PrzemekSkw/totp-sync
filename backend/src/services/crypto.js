const CryptoJS = require('crypto-js');
const bcrypt = require('bcryptjs');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be exactly 32 characters');
}

// Szyfrowanie sekretu TOTP (AES-256)
const encryptSecret = (secret) => {
  try {
    const encrypted = CryptoJS.AES.encrypt(secret, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt secret');
  }
};

// Deszyfrowanie sekretu TOTP
const decryptSecret = (encryptedSecret) => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedSecret, ENCRYPTION_KEY);
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt secret');
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

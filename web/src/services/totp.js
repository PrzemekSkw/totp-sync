import { authenticator } from 'otplib';

// Generuj kod TOTP lokalnie
export const generateTOTP = (secret, options = {}) => {
  try {
    authenticator.options = {
      algorithm: options.algorithm || 'SHA1',
      digits: options.digits || 6,
      step: options.period || 30,
    };

    return authenticator.generate(secret);
  } catch (error) {
    console.error('TOTP generation error:', error);
    return null;
  }
};

// Oblicz pozostały czas dla kodu
export const getTimeRemaining = (period = 30) => {
  return period - (Math.floor(Date.now() / 1000) % period);
};

// Sprawdź czy kod TOTP jest poprawny
export const verifyTOTP = (token, secret, options = {}) => {
  try {
    authenticator.options = {
      algorithm: options.algorithm || 'SHA1',
      digits: options.digits || 6,
      step: options.period || 30,
    };

    return authenticator.verify({ token, secret });
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
};

// Parse otpauth:// URI
export const parseOtpAuthUri = (uri) => {
  try {
    const url = new URL(uri);
    
    if (url.protocol !== 'otpauth:') {
      throw new Error('Invalid protocol');
    }

    const type = url.hostname;
    if (type !== 'totp') {
      throw new Error('Only TOTP is supported');
    }

    const label = decodeURIComponent(url.pathname.slice(1));
    const params = new URLSearchParams(url.search);

    const secret = params.get('secret');
    if (!secret) {
      throw new Error('Secret is required');
    }

    let issuer = params.get('issuer') || '';
    let name = label;

    if (label.includes(':')) {
      const parts = label.split(':');
      issuer = issuer || parts[0];
      name = parts[1] || parts[0];
    }

    return {
      name: name.trim(),
      issuer: issuer.trim(),
      secret: secret.replace(/\s/g, ''),
      algorithm: params.get('algorithm') || 'SHA1',
      digits: parseInt(params.get('digits') || '6'),
      period: parseInt(params.get('period') || '30'),
    };
  } catch (error) {
    throw new Error(`Failed to parse URI: ${error.message}`);
  }
};

// Generuj otpauth:// URI
export const generateOtpAuthUri = (entry) => {
  const label = entry.issuer 
    ? `${encodeURIComponent(entry.issuer)}:${encodeURIComponent(entry.name)}`
    : encodeURIComponent(entry.name);
  
  const params = new URLSearchParams({
    secret: entry.secret,
    issuer: entry.issuer || '',
    algorithm: entry.algorithm,
    digits: entry.digits.toString(),
    period: entry.period.toString(),
  });

  return `otpauth://totp/${label}?${params.toString()}`;
};

// Formatuj kod TOTP (dodaj spacje co 3 cyfry)
export const formatTOTPCode = (code) => {
  if (!code) return '';
  return code.match(/.{1,3}/g)?.join(' ') || code;
};

// Walidacja sekretu TOTP (Base32)
export const isValidSecret = (secret) => {
  const base32Regex = /^[A-Z2-7]+=*$/i;
  return base32Regex.test(secret.replace(/\s/g, ''));
};

// Generuj losowy sekret TOTP
export const generateSecret = () => {
  return authenticator.generateSecret();
};

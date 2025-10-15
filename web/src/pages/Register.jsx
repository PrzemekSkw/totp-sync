import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Shield, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import useStore from '../store/useStore';
import Button from '../components/Button';
import Input from '../components/Input';

export default function Register() {
  const navigate = useNavigate();
  const register = useStore((state) => state.register);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    totpCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // 2FA Setup state
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [copiedBackup, setCopiedBackup] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    
    const result = await register(formData.email, formData.password);
    
    if (result.success) {
      toast.success('Registered successfully!');
      navigate('/');
    } else if (result.requires2FA) {
      // Backend wymaga setup 2FA
      try {
        // Generuj QR kod z otpauth URL
        const qrCode = await QRCode.toDataURL(result.twoFactor.otpauthUrl);
        setQrCodeUrl(qrCode);
        setBackupCodes(result.twoFactor.backupCodes);
        setShow2FASetup(true);
        setLoading(false);
      } catch (error) {
        toast.error('Failed to generate QR code');
        setLoading(false);
      }
    } else {
      toast.error(result.error);
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    
    if (!formData.totpCode || formData.totpCode.length !== 6) {
      setErrors({ totpCode: '2FA code must be 6 digits' });
      return;
    }

    setLoading(true);

    const result = await register(
      formData.email, 
      formData.password, 
      formData.totpCode
    );

    if (result.success) {
      toast.success('2FA enabled! Welcome to TOTP Sync!');
      navigate('/');
    } else {
      toast.error(result.error || 'Invalid 2FA code');
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    const codes = backupCodes.join('\n');
    navigator.clipboard.writeText(codes);
    setCopiedBackup(true);
    toast.success('Backup codes copied!');
    setTimeout(() => setCopiedBackup(false), 2000);
  };

  // Modal 2FA Setup
  if (show2FASetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="max-w-lg w-full">
          <div className="card">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Setup Two-Factor Authentication
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Scan the QR code with your authenticator app
              </p>
            </div>

            {/* QR Code */}
            <div className="bg-white dark:bg-gray-700 p-6 rounded-xl mb-6">
              <div className="flex justify-center mb-4">
                {qrCodeUrl && (
                  <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                )}
              </div>
              
              {/* Manual Entry Option */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center">
                  Can't scan? Enter manually:
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 font-mono text-sm break-all text-center">
                  {backupCodes.length > 0 && formData.email ? 
                    `otpauth://totp/TOTP%20Sync:${formData.email}?secret=${backupCodes[0]}&issuer=TOTP%20Sync`.match(/secret=([^&]+)/)?.[1] || 'Loading...'
                    : 'Loading...'}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const secret = `otpauth://totp/TOTP%20Sync:${formData.email}?secret=${backupCodes[0]}&issuer=TOTP%20Sync`.match(/secret=([^&]+)/)?.[1];
                    if (secret) {
                      navigator.clipboard.writeText(secret);
                      toast.success('Secret copied!');
                    }
                  }}
                  className="mt-2 w-full text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  📋 Copy Secret
                </button>
              </div>
            </div>

            {/* Backup Codes */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Backup Codes
                </h3>
                <button
                  onClick={copyBackupCodes}
                  className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                >
                  {copiedBackup ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Save these codes in a safe place. You can use them to access your account if you lose your device.
              </p>
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {backupCodes.map((code, i) => (
                  <div 
                    key={i}
                    className="bg-white dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-600"
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>

            {/* Verification Form */}
            <form onSubmit={handleVerify2FA} className="space-y-4">
              <Input
                label="Enter 6-Digit Code"
                type="text"
                name="totpCode"
                placeholder="000000"
                value={formData.totpCode}
                onChange={handleChange}
                error={errors.totpCode}
                icon={Shield}
                maxLength={6}
                autoFocus
              />

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full"
              >
                Verify & Complete Registration
              </Button>
            </form>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
              Make sure to save your backup codes before continuing
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Standard registration form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            TOTP Sync
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Secure two-factor authentication
          </p>
        </div>

        {/* Register Form */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Create Account
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              icon={Mail}
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              icon={Lock}
              autoComplete="new-password"
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              icon={Lock}
              autoComplete="new-password"
            />

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full"
            >
              Sign Up
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
          Your data is encrypted and secure
        </p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Copy, Check } from 'lucide-react';
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
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [pendingData, setPendingData] = useState(null);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

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
      try {
        // Generuj mniejszy QR kod
        const qrCode = await QRCode.toDataURL(result.twoFactor.otpauthUrl, {
          width: 180,
          margin: 1,
        });
        setQrCodeUrl(qrCode);
        setSecret(result.twoFactor.secret);
        setBackupCodes(result.twoFactor.backupCodes);
        setPendingData(result.pendingRegistration);
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
      formData.totpCode,
      pendingData
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

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopiedSecret(true);
      toast.success('Secret copied!');
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  // Modal 2FA Setup - KOMPAKTOWY
  if (show2FASetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 px-4 py-6">
        <div className="max-w-md w-full">
          <div className="card">
            {/* Header - mniejszy */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 mb-3">
                <img src="/logo.png" alt="TOTP Sync" className="w-full h-full rounded-xl" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                Setup 2FA
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Scan with your authenticator app
              </p>
            </div>

            {/* QR Code - mniejszy */}
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg mb-4">
              <div className="flex justify-center mb-3">
                {qrCodeUrl && (
                  <div className="inline-block p-2 bg-white rounded">
                    <img src={qrCodeUrl} alt="QR Code" className="w-44 h-44" />
                  </div>
                )}
              </div>
              
              {/* Manual Entry - kompaktowy */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center">
                  Or enter manually:
                </p>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded p-2">
                  <code className="flex-1 text-xs font-mono break-all text-center">
                    {secret}
                  </code>
                  <button
                    type="button"
                    onClick={copySecret}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors shrink-0"
                  >
                    {copiedSecret ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Backup Codes - kompaktowy */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Backup Codes
                </h3>
                <button
                  onClick={copyBackupCodes}
                  className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                >
                  {copiedBackup ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Save these codes safely. Use them if you lose your device.
              </p>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
                {backupCodes.map((code, i) => (
                  <div 
                    key={i}
                    className="bg-white dark:bg-gray-800 px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 text-center"
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>

            {/* Verification Form - kompaktowy */}
            <form onSubmit={handleVerify2FA} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  name="totpCode"
                  placeholder="000000"
                  value={formData.totpCode}
                  onChange={handleChange}
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoFocus
                  className="w-full px-3 py-2 text-center text-lg tracking-widest font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {errors.totpCode && (
                  <p className="mt-1 text-xs text-red-600">{errors.totpCode}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full"
              >
                Verify & Complete
              </Button>
            </form>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
              Save your backup codes before continuing
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
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
            <img src="/logo.png" alt="TOTP Sync" className="w-full h-full rounded-2xl" />
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

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { startAuthentication } from '@simplewebauthn/browser';
import useStore from '../store/useStore';
import { webAuthnAPI } from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';

export default function Login() {
  const navigate = useNavigate();
  const login = useStore((state) => state.login);
  const setAuth = useStore((state) => state.setAuth);
  
  const [formData, setFormData] = useState({
    email: localStorage.getItem('rememberedEmail') || '',
    password: '',
    totpCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [webAuthnLoading, setWebAuthnLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('rememberedEmail'));
  const [requires2FA, setRequires2FA] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
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
    }
    
    // Validation for 2FA - accept 6 digits (TOTP) or 8 characters (backup code)
    if (requires2FA && !formData.totpCode) {
      newErrors.totpCode = '2FA code is required';
    } else if (requires2FA && formData.totpCode.length !== 6 && formData.totpCode.length !== 8) {
      newErrors.totpCode = '2FA code must be 6 digits or 8-character backup code';
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
    
    try {
      const result = await login(formData.email, formData.password, formData.totpCode);
      
      // Check if backend requires 2FA
      if (result.requires2FA) {
        setRequires2FA(true);
        setLoading(false);
        return;
      }
      
      if (result.success) {
        // Remember email if checkbox is checked
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', formData.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        
        toast.success('Logged in successfully!');
        navigate('/');
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (error) {
      toast.error('Login failed');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  // WebAuthn login handler
  const handleWebAuthnLogin = async () => {
    if (!formData.email) {
      setErrors({ email: 'Email is required for security key login' });
      return;
    }

    setWebAuthnLoading(true);
    
    try {
      // Get authentication options from server
      const optionsResponse = await webAuthnAPI.loginOptions(formData.email);
      const { userId, ...options } = optionsResponse.data;

      // Start authentication with security key
      const credential = await startAuthentication(options);

      // Verify authentication with server
      const verifyResponse = await webAuthnAPI.loginVerify(credential, userId);

      if (verifyResponse.data.success) {
        // Store token and user data using setAuth
        const { token, user } = verifyResponse.data;
        
        // Use setAuth to properly update store and load entries
        setAuth(token, user);

        // Remember email if checkbox is checked
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', formData.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        toast.success('Logged in with security key!');
        navigate('/');
      }
    } catch (error) {
      console.error('WebAuthn login error:', error);
      
      if (error.name === 'NotAllowedError') {
        toast.error('Authentication was cancelled');
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to authenticate with security key');
      }
    } finally {
      setWebAuthnLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
            <img src="/logo.png" alt="TOTP Sync" className="w-full h-full drop-shadow-lg rounded-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            TOTP Sync
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Secure two-factor authentication
          </p>
        </div>

        {/* Login Form */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Sign In
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
              disabled={requires2FA}
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
              autoComplete="current-password"
              disabled={requires2FA}
            />

            {/* 2FA Code Field - shows only when requires2FA = true */}
            {requires2FA && (
              <Input
                label="Two-Factor Code"
                type="text"
                name="totpCode"
                placeholder="123456 or ABCD1234"
                value={formData.totpCode}
                onChange={handleChange}
                error={errors.totpCode}
                icon={Lock}
                autoComplete="one-time-code"
                maxLength={8}
                autoFocus
              />
            )}

            {/* Remember Me - hide when requires 2FA */}
            {!requires2FA && (
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="remember-me" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  Remember my email
                </label>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full"
            >
              {requires2FA ? 'Verify 2FA Code' : 'Sign In'}
            </Button>

            {/* Back button when requires 2FA */}
            {requires2FA && (
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => {
                  setRequires2FA(false);
                  setFormData((prev) => ({ ...prev, totpCode: '' }));
                }}
              >
                Back to Login
              </Button>
            )}
          </form>

          {/* WebAuthn Login - show only when NOT requiring 2FA */}
          {!requires2FA && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="secondary"
                icon={Key}
                loading={webAuthnLoading}
                onClick={handleWebAuthnLogin}
                className="w-full"
              >
                Sign in with Security Key
              </Button>
            </>
          )}

          {/* Register Link - hide when requires 2FA */}
          {!requires2FA && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <Link 
                  to="/register" 
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
          Your data is encrypted and secure
        </p>
      </div>
    </div>
  );
}
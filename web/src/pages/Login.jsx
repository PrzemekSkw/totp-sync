import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import useStore from '../store/useStore';
import Button from '../components/Button';
import Input from '../components/Input';

export default function Login() {
  const navigate = useNavigate();
  const login = useStore((state) => state.login);
  
  const [formData, setFormData] = useState({
    email: localStorage.getItem('rememberedEmail') || '',
    password: '',
    totpCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('rememberedEmail'));
  const [requires2FA, setRequires2FA] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Wyczyść błąd dla tego pola
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
    
    // Walidacja 2FA tylko jeśli pole jest widoczne
    if (requires2FA && !formData.totpCode) {
      newErrors.totpCode = '2FA code is required';
    } else if (requires2FA && formData.totpCode.length !== 6) {
      newErrors.totpCode = '2FA code must be 6 digits';
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
      
      // ✅ Sprawdź czy backend wymaga 2FA
      if (result.requires2FA) {
        setRequires2FA(true);
        setLoading(false);
        // Nie pokazuj toasta - pole 2FA pojawi się automatycznie
        return;
      }
      
      if (result.success) {
        // Zapamiętaj email jeśli checkbox zaznaczony
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', formData.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        
        toast.success('Logged in successfully!');
        navigate('/');
      } else {
        // Toast tylko przy faktycznym błędzie
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Login failed');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

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

            {/* 2FA Code Field - pokazuje się tylko gdy requires2FA = true */}
            {requires2FA && (
              <Input
                label="Two-Factor Code"
                type="text"
                name="totpCode"
                placeholder="000000"
                value={formData.totpCode}
                onChange={handleChange}
                error={errors.totpCode}
                icon={Shield}
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
              />
            )}

            {/* Remember Me - ukryj gdy wymaga 2FA */}
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

            {/* Przycisk "Back" gdy wymaga 2FA */}
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

          {/* Register Link - ukryj gdy wymaga 2FA */}
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

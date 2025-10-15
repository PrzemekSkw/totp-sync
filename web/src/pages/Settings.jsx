import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, LogOut, Moon, Sun, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import useStore from '../store/useStore';
import { authAPI } from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';
import TwoFactorSetup from '../components/TwoFactorSetup';

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout, isDarkMode, toggleTheme, hideCodesByDefault, toggleHideCodes } = useStore();
  const [loading, setLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [disabling2FA, setDisabling2FA] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  // Sprawdź status 2FA
  useEffect(() => {
    const check2FAStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/auth/2fa/status', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setTwoFactorEnabled(data.enabled);
      } catch (error) {
        console.error('Failed to check 2FA status:', error);
      }
    };
    check2FAStatus();
  }, []);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validatePassword = () => {
    const newErrors = {};
    
    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (!passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    return newErrors;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    const newErrors = validatePassword();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    
    try {
      await authAPI.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      
      toast.success('Password changed successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    const password = prompt('Enter your password to disable 2FA:');
    if (!password) return;

    const token = prompt('Enter your current 2FA code:');
    if (!token) return;

    setDisabling2FA(true);
    try {
      const authToken = localStorage.getItem('token');
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password, token })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      toast.success('2FA disabled successfully');
      setTwoFactorEnabled(false);
    } catch (error) {
      toast.error(error.message || 'Failed to disable 2FA');
    } finally {
      setDisabling2FA(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Settings
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Account Info */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Account Information
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Email
              </label>
              <p className="text-gray-900 dark:text-white font-medium">
                {user?.email}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Account created
              </label>
              <p className="text-gray-900 dark:text-white font-medium">
                {user?.created_at 
                  ? new Date(user.created_at).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Change Password
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              name="currentPassword"
              placeholder="••••••••"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              error={errors.currentPassword}
              icon={Lock}
            />

            <Input
              label="New Password"
              type="password"
              name="newPassword"
              placeholder="••••••••"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              error={errors.newPassword}
              icon={Lock}
            />

            <Input
              label="Confirm New Password"
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              error={errors.confirmPassword}
              icon={Lock}
            />

            <Button
              type="submit"
              variant="primary"
              loading={loading}
            >
              Change Password
            </Button>
          </form>
        </div>

        {/* Two-Factor Authentication */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Two-Factor Authentication
          </h2>
          
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <p className="font-medium text-gray-900 dark:text-white">
                  {twoFactorEnabled ? '2FA Enabled' : '2FA Disabled'}
                </p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {twoFactorEnabled 
                  ? 'Your account is protected with two-factor authentication'
                  : 'Add an extra layer of security to your account'}
              </p>
            </div>
            
            {twoFactorEnabled ? (
              <Button
                variant="danger"
                onClick={handleDisable2FA}
                loading={disabling2FA}
              >
                Disable
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => setShowTwoFactorSetup(true)}
              >
                Enable
              </Button>
            )}
          </div>
        </div>

        {/* Appearance */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Appearance
          </h2>
          
          <div className="space-y-4">
            {/* Dark Mode */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Dark Mode
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Use dark theme for better visibility in low light
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  isDarkMode ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    isDarkMode ? 'translate-x-7' : 'translate-x-1'
                  }`}
                >
                  {isDarkMode ? (
                    <Moon className="w-4 h-4 m-1 text-primary-600" />
                  ) : (
                    <Sun className="w-4 h-4 m-1 text-gray-400" />
                  )}
                </span>
              </button>
            </div>

            {/* Hide Codes */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Hide Codes by Default
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Keep TOTP codes hidden until you click to reveal them
                </p>
              </div>
              <button
                onClick={toggleHideCodes}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  hideCodesByDefault ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    hideCodesByDefault ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card border-red-200 dark:border-red-800">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
            Danger Zone
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Log Out
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sign out of your account
                </p>
              </div>
              <Button
                variant="danger"
                icon={LogOut}
                onClick={handleLogout}
              >
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Two-Factor Setup Modal */}
      {showTwoFactorSetup && (
        <TwoFactorSetup 
          onClose={() => setShowTwoFactorSetup(false)}
          onSuccess={() => setTwoFactorEnabled(true)}
        />
      )}
    </div>
  );
}

import { useState } from 'react';
import { Download, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import Button from './Button';
import Input from './Input';

export default function TwoFactorSetup({ onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: QR, 2: Verify, 3: Backup codes
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [verifyCode, setVerifyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Krok 1: Setup - pobierz QR i backup kody
  const handleSetup = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Setup failed');
      }

      const data = await response.json();
      
      // Generuj QR kod
      const qrDataUrl = await QRCode.toDataURL(data.otpauthUrl);
      setQrCode(qrDataUrl);
      setSecret(data.secret);
      setBackupCodes(data.backupCodes);
      
      setStep(2);
    } catch (error) {
      toast.error('Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  // Krok 2: Weryfikuj kod i włącz 2FA
  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (verifyCode.length !== 6) {
      toast.error('Code must be 6 digits');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verifyCode }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Verification failed');
      }

      toast.success('2FA enabled successfully!');
      setStep(3);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Kopiuj secret
  const copySecret = async () => {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    toast.success('Secret copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Pobierz backup kody
  const downloadBackupCodes = () => {
    const text = backupCodes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'totp-sync-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup codes downloaded');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
            <img src="/logo.png" alt="TOTP Sync" className="w-full h-full rounded-2xl" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Setup Two-Factor Authentication
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Add an extra layer of security to your account by enabling two-factor authentication.
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  <strong>You'll need:</strong> An authenticator app like Google Authenticator, Authy, or 1Password.
                </p>
              </div>

              <Button
                variant="primary"
                onClick={handleSetup}
                loading={loading}
                className="w-full"
              >
                Start Setup
              </Button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Scan this QR code with your authenticator app
                </p>
                
                {qrCode && (
                  <img 
                    src={qrCode} 
                    alt="QR Code" 
                    className="mx-auto w-48 h-48 border-4 border-gray-200 dark:border-gray-700 rounded-lg"
                  />
                )}

                <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Or enter this code manually:
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="text-sm font-mono">{secret}</code>
                    <button
                      type="button"
                      onClick={copySecret}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <Input
                label="Enter 6-digit code from your app"
                type="text"
                maxLength="6"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="text-center text-2xl tracking-widest"
              />

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full"
              >
                Verify & Enable
              </Button>
            </form>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-3">
                  <img src="/logo.png" alt="Success" className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  2FA Enabled!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your account is now protected with two-factor authentication
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-900 dark:text-yellow-200 mb-3">
                  <strong>Save your backup codes!</strong> You can use these if you lose access to your authenticator app.
                </p>
                
                <div className="bg-white dark:bg-gray-800 rounded p-3 mb-3">
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {backupCodes.map((code, i) => (
                      <div key={i} className="text-gray-900 dark:text-gray-100">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  variant="secondary"
                  icon={Download}
                  onClick={downloadBackupCodes}
                  className="w-full"
                >
                  Download Backup Codes
                </Button>
              </div>

              <Button
                variant="primary"
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="w-full"
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

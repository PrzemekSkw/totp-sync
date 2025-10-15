import { useState } from 'react';
import { X, QrCode, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import useStore from '../store/useStore';
import { parseOtpAuthUri, isValidSecret } from '../services/totp';
import Button from './Button';
import Input from './Input';

export default function AddEntryModal({ onClose }) {
  const addEntry = useStore((state) => state.addEntry);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('manual'); // 'manual' lub 'uri'
  
  const [formData, setFormData] = useState({
    name: '',
    issuer: '',
    secret: '',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  });
  
  const [uriInput, setUriInput] = useState('');
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateManual = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.secret.trim()) {
      newErrors.secret = 'Secret is required';
    } else if (!isValidSecret(formData.secret)) {
      newErrors.secret = 'Invalid secret format (must be Base32)';
    }
    
    return newErrors;
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateManual();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    
    const result = await addEntry({
      ...formData,
      secret: formData.secret.replace(/\s/g, '').toUpperCase(),
      digits: parseInt(formData.digits),
      period: parseInt(formData.period),
    });
    
    if (result.success) {
      toast.success('Entry added successfully');
      onClose();
    } else {
      toast.error(result.error);
      setLoading(false);
    }
  };

  const handleUriSubmit = async (e) => {
    e.preventDefault();
    
    if (!uriInput.trim()) {
      toast.error('Please enter a URI');
      return;
    }

    try {
      const parsed = parseOtpAuthUri(uriInput);
      
      setLoading(true);
      const result = await addEntry(parsed);
      
      if (result.success) {
        toast.success('Entry added successfully');
        onClose();
      } else {
        toast.error(result.error);
        setLoading(false);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Add TOTP Entry
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              mode === 'manual'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Key className="w-4 h-4 inline mr-2" />
            Manual Entry
          </button>
          <button
            onClick={() => setMode('uri')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              mode === 'uri'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <QrCode className="w-4 h-4 inline mr-2" />
            From URI
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {mode === 'manual' ? (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <Input
                label="Name"
                name="name"
                placeholder="e.g., Google, GitHub"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
              />

              <Input
                label="Issuer (optional)"
                name="issuer"
                placeholder="e.g., google.com"
                value={formData.issuer}
                onChange={handleChange}
              />

              <Input
                label="Secret Key"
                name="secret"
                placeholder="Base32 encoded secret"
                value={formData.secret}
                onChange={handleChange}
                error={errors.secret}
              />

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Algorithm
                  </label>
                  <select
                    name="algorithm"
                    value={formData.algorithm}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="SHA1">SHA1</option>
                    <option value="SHA256">SHA256</option>
                    <option value="SHA512">SHA512</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Digits
                  </label>
                  <select
                    name="digits"
                    value={formData.digits}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Period (s)
                  </label>
                  <input
                    type="number"
                    name="period"
                    min="15"
                    max="120"
                    value={formData.period}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  className="flex-1"
                >
                  Add Entry
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleUriSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  otpauth:// URI
                </label>
                <textarea
                  value={uriInput}
                  onChange={(e) => setUriInput(e.target.value)}
                  placeholder="otpauth://totp/Example:user@example.com?secret=..."
                  rows="4"
                  className="input resize-none"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Paste the otpauth:// URI from your QR code or export
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  className="flex-1"
                >
                  Add Entry
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

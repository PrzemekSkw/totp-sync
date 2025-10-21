import { useState } from 'react';
import { X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { totpAPI } from '../services/api';
import useStore from '../store/useStore';
import Button from './Button';
import Input from './Input';

export default function EditEntryModal({ entry, onClose }) {
  const fetchEntries = useStore((state) => state.fetchEntries);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: entry.name || '',
    issuer: entry.issuer || '',
    algorithm: entry.algorithm || 'sha1',
    digits: entry.digits || 6,
    period: entry.period || 30,
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    const digits = parseInt(formData.digits);
    if (![6, 7, 8].includes(digits)) {
      newErrors.digits = 'Digits must be 6, 7, or 8';
    }

    const period = parseInt(formData.period);
    if (period < 10 || period > 120) {
      newErrors.period = 'Period must be between 10 and 120 seconds';
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
      await totpAPI.update(entry.id, {
        name: formData.name.trim(),
        issuer: formData.issuer.trim() || null,
        algorithm: formData.algorithm,
        digits: parseInt(formData.digits),
        period: parseInt(formData.period),
      });

      toast.success('Entry updated successfully');
      await fetchEntries();
      onClose();
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.error || 'Failed to update entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Edit Entry
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="e.g., username@example.com"
            autoFocus
          />

          <Input
            label="Issuer (optional)"
            name="issuer"
            value={formData.issuer}
            onChange={handleChange}
            placeholder="e.g., Google, GitHub"
          />

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Algorithm
              </label>
              <select
                name="algorithm"
                value={formData.algorithm}
                onChange={handleChange}
                className="input"
              >
                <option value="sha1">SHA1</option>
                <option value="sha256">SHA256</option>
                <option value="sha512">SHA512</option>
              </select>
            </div>

            <Input
              label="Digits"
              name="digits"
              type="number"
              min="6"
              max="8"
              value={formData.digits}
              onChange={handleChange}
              error={errors.digits}
            />

            <Input
              label="Period (s)"
              name="period"
              type="number"
              min="10"
              max="120"
              value={formData.period}
              onChange={handleChange}
              error={errors.period}
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <strong>Note:</strong> You cannot change the secret key. If you need a different secret, delete this entry and create a new one.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
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
              icon={Save}
              loading={loading}
              className="flex-1"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

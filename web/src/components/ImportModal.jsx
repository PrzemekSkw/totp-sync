import { useState } from 'react';
import { X, Upload, FileJson, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { syncAPI } from '../services/api';
import useStore from '../store/useStore';
import Button from './Button';

export default function ImportModal({ onClose }) {
  const fetchEntries = useStore((state) => state.fetchEntries);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('json'); // 'json' lub 'uri'
  const [replaceAll, setReplaceAll] = useState(false);

  // Import z JSON
  const handleJsonImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Obsługa różnych formatów
      let entries = [];
      
      if (Array.isArray(data)) {
        entries = data;
      } else if (data.entries && Array.isArray(data.entries)) {
        entries = data.entries;
      } else if (data.data && Array.isArray(data.data)) {
        // Format 2FAuth
        entries = data.data.map(item => ({
          name: item.account || item.service || 'Unknown',
          issuer: item.service || '',
          secret: item.secret,
          algorithm: (item.algorithm || 'sha1').toUpperCase(),
          digits: item.digits || 6,
          period: item.period || 30,
        }));
      } else if (data.tokens && Array.isArray(data.tokens)) {
        // Format FreeOTP+
        entries = data.tokens.map(token => ({
          name: token.label || token.name,
          issuer: token.issuerExt || token.issuer || '',
          secret: token.secret,
          algorithm: token.algo || 'SHA1',
          digits: token.digits || 6,
          period: token.period || 30,
        }));
      } else {
        throw new Error('Invalid JSON format');
      }

      if (entries.length === 0) {
        toast.error('No entries found in file');
        return;
      }

      setLoading(true);
      const response = await syncAPI.importJson(entries, replaceAll);
      
      toast.success(
        `Imported ${response.data.imported} entries${
          response.data.failed > 0 ? `, ${response.data.failed} failed` : ''
        }`
      );
      
      await fetchEntries();
      onClose();
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error.message || 'Failed to import file');
    } finally {
      setLoading(false);
    }
  };

  // Import z URI list
  const handleUriImport = async (text) => {
    if (!text.trim()) {
      toast.error('Please paste URIs');
      return;
    }

    try {
      // Podziel na linie i wyfiltruj puste
      const uris = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('otpauth://'));

      if (uris.length === 0) {
        toast.error('No valid otpauth:// URIs found');
        return;
      }

      setLoading(true);
      const response = await syncAPI.importUri(uris);
      
      toast.success(
        `Imported ${response.data.imported} entries${
          response.data.failed > 0 ? `, ${response.data.failed} failed` : ''
        }`
      );
      
      await fetchEntries();
      onClose();
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error.response?.data?.error || 'Failed to import URIs');
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
            Import Entries
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
            onClick={() => setMode('json')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              mode === 'json'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <FileJson className="w-4 h-4 inline mr-2" />
            JSON File
          </button>
          <button
            onClick={() => setMode('uri')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              mode === 'uri'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Link2 className="w-4 h-4 inline mr-2" />
            URI List
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {mode === 'json' ? (
            <>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Import entries from FreeOTP+, 2FAuth, or TOTP Sync JSON export
                </p>

                <label className="block">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleJsonImport}
                    disabled={loading}
                    className="hidden"
                    id="json-file-input"
                  />
                  <Button
                    variant="secondary"
                    icon={Upload}
                    loading={loading}
                    className="w-full"
                    onClick={() => document.getElementById('json-file-input')?.click()}
                    type="button"
                  >
                    Choose JSON File
                  </Button>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="replace-all"
                  checked={replaceAll}
                  onChange={(e) => setReplaceAll(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label
                  htmlFor="replace-all"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  Replace all existing entries
                </label>
              </div>
            </>
          ) : (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Paste otpauth:// URIs (one per line)
              </p>

              <textarea
                placeholder="otpauth://totp/Example:user@example.com?secret=...&#10;otpauth://totp/GitHub:username?secret=..."
                rows="6"
                className="input resize-none"
                id="uri-textarea"
                disabled={loading}
              />

              <Button
                variant="primary"
                icon={Upload}
                loading={loading}
                className="w-full mt-4"
                onClick={() => {
                  const textarea = document.getElementById('uri-textarea');
                  handleUriImport(textarea?.value || '');
                }}
              >
                Import URIs
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <Button
            variant="secondary"
            onClick={onClose}
            className="w-full"
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

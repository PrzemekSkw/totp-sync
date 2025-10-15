import { useState } from 'react';
import { X, Download, FileJson, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { syncAPI } from '../services/api';
import Button from './Button';

export default function ExportModal({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('json'); // 'json' lub 'uri'

  // Export do JSON
  const handleJsonExport = async () => {
    try {
      setLoading(true);
      const response = await syncAPI.export();
      
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `totp-sync-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Export completed');
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export entries');
    } finally {
      setLoading(false);
    }
  };

  // Export do URI list
  const handleUriExport = async () => {
    try {
      setLoading(true);
      const response = await syncAPI.exportUri();
      
      const uriList = response.data.uris.join('\n');
      const dataBlob = new Blob([uriList], { type: 'text/plain' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `totp-sync-uris-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Export completed');
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export URIs');
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
            Export Entries
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
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Export all entries to a JSON file compatible with FreeOTP+, 2FAuth, and TOTP Sync
              </p>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ <strong>Warning:</strong> The exported file contains unencrypted TOTP secrets. Store it securely!
                </p>
              </div>

              <Button
                variant="primary"
                icon={Download}
                loading={loading}
                onClick={handleJsonExport}
                className="w-full"
              >
                Download JSON
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Export all entries as otpauth:// URIs (one per line)
              </p>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ <strong>Warning:</strong> URIs contain unencrypted TOTP secrets. Store the file securely!
                </p>
              </div>

              <Button
                variant="primary"
                icon={Download}
                loading={loading}
                onClick={handleUriExport}
                className="w-full"
              >
                Download URIs
              </Button>
            </>
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

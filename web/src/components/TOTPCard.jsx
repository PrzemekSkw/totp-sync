import { useState, useEffect } from 'react';
import { Copy, Trash2, Check, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { totpAPI } from '../services/api';
import { formatTOTPCode } from '../services/totp';
import useStore from '../store/useStore';

export default function TOTPCard({ entry, isSelected, onToggleSelect }) {
  const deleteEntry = useStore((state) => state.deleteEntry);
  const hideCodesByDefault = useStore((state) => state.hideCodesByDefault);
  
  const [code, setCode] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(!hideCodesByDefault);

  // Generuj kod TOTP
  const generateCode = async () => {
    try {
      const response = await totpAPI.generate(entry.id);
      setCode(formatTOTPCode(response.data.token));
      setTimeRemaining(response.data.timeRemaining);
    } catch (error) {
      console.error('Failed to generate code:', error);
      setCode('••• •••');
    }
  };

  // Automatycznie ukryj po 10 sekundach
  useEffect(() => {
    if (isVisible) {
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 10000);
      
      return () => clearTimeout(hideTimer);
    }
  }, [isVisible]);

  // Timer odświeżania kodu
  useEffect(() => {
    generateCode();
    
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          generateCode();
          return entry.period || 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [entry.id]);

  // Kopiuj kod do schowka
  const copyToClipboard = async () => {
    if (!isVisible) {
      setIsVisible(true);
      return;
    }
    
    try {
      const cleanCode = code.replace(/\s/g, '');
      await navigator.clipboard.writeText(cleanCode);
      setCopied(true);
      toast.success('Code copied to clipboard');
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  // Usuń wpis
  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${entry.name}"?`)) {
      return;
    }

    setLoading(true);
    const result = await deleteEntry(entry.id);
    
    if (result.success) {
      toast.success('Entry deleted');
    } else {
      toast.error(result.error);
      setLoading(false);
    }
  };

  // Progress bar (ile czasu zostało)
  const progress = (timeRemaining / (entry.period || 30)) * 100;

  return (
    <div className="card relative overflow-hidden group hover:shadow-lg transition-all duration-200">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full transition-all duration-1000 ${
            timeRemaining <= 5 
              ? 'bg-red-500' 
              : timeRemaining <= 10 
              ? 'bg-yellow-500' 
              : 'bg-primary-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4 pt-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(entry.id)}
            className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            onClick={(e) => e.stopPropagation()}
          />
          
          <div className="flex-1 min-w-0">
            {entry.issuer && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {entry.issuer}
              </p>
            )}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {entry.name}
            </h3>
          </div>
        </div>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          disabled={loading}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
          aria-label="Delete entry"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* TOTP Code */}
      <div className="mb-4 flex items-center gap-2">
        <div 
          onClick={copyToClipboard}
          className="totp-code text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors flex-1 cursor-pointer"
        >
          {isVisible ? (code || '••• •••') : '••• •••'}
        </div>
        
        {/* Eye icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(!isVisible);
          }}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          aria-label={isVisible ? "Hide code" : "Show code"}
        >
          {isVisible ? (
            <EyeOff className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`text-sm font-medium ${
            timeRemaining <= 5 
              ? 'text-red-600' 
              : timeRemaining <= 10 
              ? 'text-yellow-600' 
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {timeRemaining}s
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {entry.digits || 6} digits · {entry.period || 30}s
          </div>
        </div>

        {/* Copy button */}
        <button
          onClick={copyToClipboard}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );
}

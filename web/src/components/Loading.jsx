import { Loader2 } from 'lucide-react';

export default function Loading({ text = 'Loading...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">{text}</p>
      </div>
    </div>
  );
}

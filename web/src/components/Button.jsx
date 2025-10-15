import { Loader2 } from 'lucide-react';

export default function Button({ 
  children, 
  variant = 'primary', 
  loading = false, 
  disabled = false,
  className = '',
  icon: Icon,
  ...props 
}) {
  const baseClasses = 'btn inline-flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  );
}

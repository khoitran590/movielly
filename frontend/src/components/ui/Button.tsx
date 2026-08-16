import { forwardRef, ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

// Gold is the one action; red is love and danger. Nothing else is saturated.
const variants = {
  primary: 'bg-tungsten text-ink hover:bg-tungsten-dim',
  secondary: 'bg-transparent text-screen border border-rail hover:border-screen',
  ghost: 'text-fog hover:text-screen hover:bg-seat',
  danger: 'text-ticket hover:bg-ticket/10',
};

const sizes = {
  sm: 'h-8 px-4',
  md: 'h-10 px-5',
  lg: 'h-12 px-6',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, className = '', children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full text-ui font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tungsten focus-visible:ring-offset-2 focus-visible:ring-offset-ink ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
);

Button.displayName = 'Button';
export default Button;

import { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-ui font-medium text-fog">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fog">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full rounded-xl border bg-seat ${error ? 'border-ticket' : 'border-rail'} py-2.5 ${icon ? 'pl-10' : 'pl-4'} pr-4 text-ui text-screen placeholder-fog outline-none transition-colors duration-200 focus:border-tungsten focus:ring-2 focus:ring-tungsten/25 ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-meta text-ticket">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;

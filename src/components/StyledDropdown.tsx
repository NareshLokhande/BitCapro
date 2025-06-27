import { ChevronDown } from 'lucide-react';
import React from 'react';

interface StyledDropdownProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
}

const StyledDropdown: React.FC<StyledDropdownProps> = ({
  id,
  name,
  value,
  onChange,
  children,
  className = '',
  placeholder,
  disabled = false,
  required = false,
  error = false,
}) => {
  return (
    <div className="relative">
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`
          w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
          appearance-none bg-white cursor-pointer
          ${error ? 'border-red-300' : 'border-gray-300'}
          ${
            disabled
              ? 'bg-gray-50 cursor-not-allowed opacity-60'
              : 'hover:border-gray-400'
          }
          ${className}
        `}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>

      {/* Custom dropdown arrow */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
        <ChevronDown
          className={`w-5 h-5 transition-transform duration-200 ${
            disabled ? 'text-gray-400' : 'text-gray-500'
          }`}
        />
      </div>
    </div>
  );
};

export default StyledDropdown;

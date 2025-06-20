'use client';

import { useState, useEffect } from 'react';

export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: any) => string | null;
}

export interface EditableFieldProps {
  label: string;
  value: any;
  type: 'text' | 'number' | 'currency' | 'date' | 'email' | 'url' | 'enum' | 'user' | 'textarea';
  fieldKey: string;
  isEditing: boolean;
  onChange: (fieldKey: string, value: any) => void;
  validation?: FieldValidation;
  options?: Array<{ value: any; label: string; id?: any }>;
  currency?: string;
  placeholder?: string;
  helpText?: string;
  isRequired?: boolean;
  isReadOnly?: boolean;
}

export function EditableField({
  label,
  value,
  type,
  fieldKey,
  isEditing,
  onChange,
  validation,
  options = [],
  currency = 'USD',
  placeholder,
  helpText,
  isRequired = false,
  isReadOnly = false
}: EditableFieldProps) {
  const [localValue, setLocalValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const validateField = (val: any): string | null => {
    if (!validation) return null;

    // Required validation
    if (validation.required && (!val || val === '')) {
      return `${label} is required`;
    }

    // Skip other validations if value is empty and not required
    if (!val || val === '') return null;

    // String validations
    if (typeof val === 'string') {
      if (validation.minLength && val.length < validation.minLength) {
        return `${label} must be at least ${validation.minLength} characters`;
      }
      if (validation.maxLength && val.length > validation.maxLength) {
        return `${label} must be no more than ${validation.maxLength} characters`;
      }
      if (validation.pattern && !validation.pattern.test(val)) {
        return `${label} format is invalid`;
      }
    }

    // Number validations
    if (type === 'number' || type === 'currency') {
      const numVal = Number(val);
      if (isNaN(numVal)) {
        return `${label} must be a valid number`;
      }
      if (validation.min !== undefined && numVal < validation.min) {
        return `${label} must be at least ${validation.min}`;
      }
      if (validation.max !== undefined && numVal > validation.max) {
        return `${label} must be no more than ${validation.max}`;
      }
    }

    // Email validation
    if (type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        return `${label} must be a valid email address`;
      }
    }

    // URL validation
    if (type === 'url') {
      try {
        new URL(val);
      } catch {
        return `${label} must be a valid URL`;
      }
    }

    // Custom validation
    if (validation.custom) {
      return validation.custom(val);
    }

    return null;
  };

  const handleChange = (newValue: any) => {
    setLocalValue(newValue);
    setTouched(true);
    
    const validationError = validateField(newValue);
    setError(validationError);
    
    // Only call onChange if validation passes
    if (!validationError) {
      onChange(fieldKey, newValue);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    const validationError = validateField(localValue);
    setError(validationError);
  };

  const formatDisplayValue = (val: any) => {
    if (val === null || val === undefined || val === '') return 'N/A';
    
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
        }).format(Number(val));
      
      case 'date':
        return new Date(val).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      
      case 'user':
        if (typeof val === 'object' && val?.name) {
          return val.name;
        }
        return val;
      
      case 'enum':
        const option = options.find(opt => opt.value === val || opt.id === val);
        return option ? option.label : val;
      
      default:
        return String(val);
    }
  };

  const renderInput = () => {
    if (isReadOnly) {
      return (
        <span className="text-gray-500 italic">
          {formatDisplayValue(localValue)} (Read-only)
        </span>
      );
    }

    const baseInputClasses = `
      w-full px-3 py-2 border rounded-lg text-base text-gray-900 bg-white transition-colors
      ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}
      focus:outline-none focus:ring-2
    `;

    switch (type) {
      case 'textarea':
        return (
          <textarea
            value={localValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={`${baseInputClasses} resize-vertical min-h-[80px]`}
            rows={3}
          />
        );

      case 'number':
      case 'currency':
        return (
          <div className="relative">
            {type === 'currency' && (
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-base">
                {currency === 'USD' ? '$' : currency}
              </span>
            )}
            <input
              type="number"
              value={localValue || ''}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={handleBlur}
              placeholder={placeholder}
              className={`${baseInputClasses} ${type === 'currency' ? 'pl-8' : ''}`}
              step={type === 'currency' ? '0.01' : 'any'}
            />
          </div>
        );

      case 'date':
        // Convert display date to input format (YYYY-MM-DD)
        const dateValue = localValue ? new Date(localValue).toISOString().split('T')[0] : '';
        return (
          <input
            type="date"
            value={dateValue}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            className={baseInputClasses}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            value={localValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder || 'Enter email address'}
            className={baseInputClasses}
          />
        );

      case 'url':
        return (
          <input
            type="url"
            value={localValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder || 'Enter URL'}
            className={baseInputClasses}
          />
        );

      case 'enum':
        return (
          <select
            value={localValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            className={baseInputClasses}
          >
            <option value="">Select {label}</option>
            {options.map((option, index) => (
              <option key={index} value={option.value || option.id}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'user':
        return (
          <select
            value={typeof localValue === 'object' ? localValue?.id : localValue || ''}
            onChange={(e) => {
              const selectedOption = options.find(opt => opt.id == e.target.value);
              handleChange(selectedOption || e.target.value);
            }}
            onBlur={handleBlur}
            className={baseInputClasses}
          >
            <option value="">Select {label}</option>
            {options.map((option, index) => (
              <option key={index} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        );

      default: // text
        return (
          <input
            type="text"
            value={localValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={baseInputClasses}
          />
        );
    }
  };

  if (!isEditing) {
    // View mode - display formatted value
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-2">
        <dt className="text-sm font-medium text-gray-500 sm:w-1/3">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </dt>
        <dd className="text-sm text-gray-900 sm:w-2/3">
          {type === 'email' && localValue && localValue !== 'N/A' ? (
            <a href={`mailto:${localValue}`} className="text-blue-600 hover:text-blue-800">
              {formatDisplayValue(localValue)}
            </a>
          ) : type === 'url' && localValue && localValue !== 'N/A' ? (
            <a 
              href={String(localValue)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              {formatDisplayValue(localValue)}
            </a>
          ) : (
            <span className={formatDisplayValue(localValue) === 'N/A' ? 'text-gray-400 italic' : ''}>
              {formatDisplayValue(localValue)}
            </span>
          )}
        </dd>
      </div>
    );
  }

  // Edit mode - display input field
  return (
    <div className="flex flex-col gap-2 py-2">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="sm:w-2/3">
        {renderInput()}
        
        {error && touched && (
          <p className="text-red-600 text-xs mt-1 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        
        {helpText && !error && (
          <p className="text-gray-500 text-xs mt-1">{helpText}</p>
        )}
      </div>
    </div>
  );
} 
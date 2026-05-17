import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
  icon?: React.ReactNode
}

export function Input({ label, error, helper, icon, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold text-navy-700">
          {label}
          {props.required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy-300">
            {icon}
          </div>
        )}
        <input
          className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm font-body text-navy-700 placeholder-navy-300 transition-all duration-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 hover:border-surface-400 disabled:bg-surface-100 disabled:text-navy-400 ${icon ? 'pl-10' : ''} ${
            error ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-100 bg-danger-50/30' : 'border-surface-300'
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger-600 font-medium">{error}</p>}
      {helper && !error && <p className="text-xs text-navy-400">{helper}</p>}
    </div>
  )
}

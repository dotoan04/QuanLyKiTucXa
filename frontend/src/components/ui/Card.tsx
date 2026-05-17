import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: 'default' | 'bordered'
  hover?: boolean
  padding?: boolean
}

export function Card({ children, className = '', variant = 'default', hover = false, padding = false, ...props }: CardProps) {
  const baseStyles = 'rounded-2xl transition-all duration-200'
  
  const variantStyles = {
    default: 'bg-white border border-surface-200/60 shadow-card',
    bordered: 'bg-white border border-surface-300',
  }

  const hoverStyles = hover ? 'hover:shadow-card-hover hover:border-surface-300 cursor-pointer' : ''
  const paddingStyles = padding ? 'p-6' : ''

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${hoverStyles} ${paddingStyles} ${className}`} {...props}>
      {children}
    </div>
  )
}

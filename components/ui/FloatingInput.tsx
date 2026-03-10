'use client'

import React, { InputHTMLAttributes, forwardRef } from 'react'

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string
    id: string
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
    ({ label, id, className = '', ...props }, ref) => {
        return (
            <div className="floating-input-box">
                <input
                    ref={ref}
                    id={id}
                    className={`floating-input ${className}`}
                    placeholder=" "
                    suppressHydrationWarning
                    {...props}
                />
                <label htmlFor={id} className="floating-label">
                    {label}
                </label>
            </div>
        )
    }
)

FloatingInput.displayName = 'FloatingInput'

export { FloatingInput }

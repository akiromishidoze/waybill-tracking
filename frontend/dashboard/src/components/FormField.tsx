import type { ReactNode } from 'react'
import s from '@/styles/components.module.css'

interface FormFieldProps {
  label: string
  error?: string
  children: ReactNode
  required?: boolean
}

export default function FormField({ label, error, children, required }: FormFieldProps) {
  return (
    <div className={s.formGroup}>
      <label className={s.formLabel}>
        {label}
        {required && <span style={{ color: 'var(--color-danger)', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--color-danger)' }}>
          {error}
        </p>
      )}
    </div>
  )
}

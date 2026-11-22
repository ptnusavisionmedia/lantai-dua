import type { InputHTMLAttributes } from 'react';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
  help?: string;
};

/** Kolom isian dengan label yang selalu terlihat; teks bantuan dan pesan galat ada di bawah kolom. */
export function TextField({ label, name, error, help, type = 'text', ...input }: TextFieldProps) {
  const id = `field-${name}`;
  const showHelp = Boolean(help) && !error;
  const describedBy = [showHelp && `${id}-help`, error && `${id}-error`].filter(Boolean).join(' ');
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`min-h-11 rounded-md border bg-surface px-3 text-base text-ink transition-colors duration-(--dur-fast) ${
          error ? 'border-danger' : 'border-border-input'
        }`}
        {...input}
      />
      {showHelp && (
        <p id={`${id}-help`} className="text-[13px] text-ink-muted">
          {help}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-[13px] font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

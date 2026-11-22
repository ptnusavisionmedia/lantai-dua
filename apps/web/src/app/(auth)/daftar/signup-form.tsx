'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Button } from '@/components/button';
import { Notice } from '@/components/notice';
import { TextField } from '@/components/text-field';
import { type FormState, signUp } from '../actions';

export function SignupForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signUp, {});

  if (state.sent) {
    return <Notice tone="success">Cek email untuk verifikasi akun, lalu klik tautannya.</Notice>;
  }

  const consentError = state.fieldErrors?.consent;
  return (
    <form action={action} noValidate className="grid gap-4">
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <input type="hidden" name="next" value={next ?? ''} />
      <TextField
        label="Nama lengkap"
        name="full_name"
        defaultValue={state.values?.full_name}
        autoComplete="name"
        required
        error={state.fieldErrors?.full_name}
      />
      <TextField
        label="Email"
        name="email"
        defaultValue={state.values?.email}
        type="email"
        autoComplete="email"
        required
        error={state.fieldErrors?.email}
      />
      <TextField
        label="Kata sandi"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        help="Minimal 8 karakter."
        error={state.fieldErrors?.password}
      />
      <div className="grid gap-1.5">
        <label className="flex min-h-11 items-start gap-3 text-sm text-ink">
          <input
            type="checkbox"
            name="consent"
            required
            aria-invalid={consentError ? true : undefined}
            aria-describedby={consentError ? 'field-consent-error' : undefined}
            className="mt-0.5 size-[18px] shrink-0 accent-primary"
          />
          <span>
            Saya menyetujui{' '}
            <Link
              href="/kebijakan-privasi"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              kebijakan privasi
            </Link>
            .
          </span>
        </label>
        {consentError && (
          <p id="field-consent-error" className="text-[13px] font-medium text-danger">
            {consentError}
          </p>
        )}
      </div>
      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? 'Memproses…' : 'Daftar'}
      </Button>
    </form>
  );
}

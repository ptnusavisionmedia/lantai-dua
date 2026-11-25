'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Button } from '@/components/button';
import { Notice } from '@/components/notice';
import { TextField } from '@/components/text-field';
import { type FormState, signIn } from '../actions';

export function LoginForm({
  next,
  initialError,
  notice,
}: {
  next?: string;
  initialError?: string;
  notice?: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, {});
  const error = state.error ?? (state.fieldErrors ? undefined : initialError);

  return (
    <form action={action} noValidate className="grid gap-4">
      {error && (
        <Notice tone="error">
          {error}
          {state.suggestSignup && (
            <>
              {' '}
              Belum punya akun?{' '}
              <Link
                href={next ? `/daftar?next=${encodeURIComponent(next)}` : '/daftar'}
                className="font-semibold underline underline-offset-4"
              >
                Daftar dulu
              </Link>
            </>
          )}
        </Notice>
      )}
      {!error && notice && <Notice tone="success">{notice}</Notice>}
      <input type="hidden" name="next" value={next ?? ''} />
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
        autoComplete="current-password"
        required
        error={state.fieldErrors?.password}
      />
      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? 'Memproses…' : 'Masuk'}
      </Button>
    </form>
  );
}

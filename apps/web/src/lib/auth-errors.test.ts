import { describe, expect, it } from 'vitest';
import { authErrorMessage } from './auth-errors';

describe('authErrorMessage', () => {
  it.each([
    ['invalid_credentials', 'Email atau kata sandi salah.'],
    [
      'email_not_confirmed',
      'Email belum diverifikasi. Cek kotak masuk, lalu klik tautan verifikasinya.',
    ],
    ['user_already_exists', 'Email ini sudah terdaftar. Silakan masuk.'],
    ['email_exists', 'Email ini sudah terdaftar. Silakan masuk.'],
    ['weak_password', 'Kata sandi minimal 8 karakter.'],
    [
      'over_email_send_rate_limit',
      'Terlalu banyak permintaan email. Coba lagi beberapa menit lagi.',
    ],
    ['over_request_rate_limit', 'Terlalu banyak percobaan. Coba lagi sebentar lagi.'],
    ['something_new', 'Terjadi kesalahan. Coba lagi.'],
    [undefined, 'Terjadi kesalahan. Coba lagi.'],
  ])('maps %s', (code, message) => {
    expect(authErrorMessage(code)).toBe(message);
  });
});

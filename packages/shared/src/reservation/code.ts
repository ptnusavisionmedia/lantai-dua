/** `L2D-` + 8 karakter dari 23456789ABCDEFGHJKMNPQRSTUVWXYZ (tanpa 0, O, 1, I, L). */
export const RESERVATION_CODE = /^L2D-[2-9A-HJKMNP-Z]{8}$/;

export function isReservationCode(value: string): boolean {
  return RESERVATION_CODE.test(value);
}

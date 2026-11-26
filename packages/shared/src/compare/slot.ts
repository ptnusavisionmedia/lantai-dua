import type { CompareItem, CurrentSlot } from './types';

/** Mouse dari daftar di dalam slot, atau null untuk ukuran manual dan slot kosong. */
export function slotItem(slot: CurrentSlot | CompareItem | null): CompareItem | null {
  if (slot === null) return null;
  if ('kind' in slot) return slot.kind === 'item' ? slot.item : null;
  return slot;
}

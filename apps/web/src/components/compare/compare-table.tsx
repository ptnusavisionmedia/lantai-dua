import type { CompareTableRow } from '@lantai-dua/shared/compare';

/**
 * Tabel spek berdampingan. Selisih ditulis dengan warna netral. Di layar sempit kolom Selisih
 * pindah ke bawah nilai incaran, supaya tabel muat tanpa scroll horizontal.
 */
export function CompareTable({ rows }: { rows: CompareTableRow[] }) {
  return (
    <table data-testid="compare-table" className="w-full table-fixed border-collapse text-left">
      <thead>
        <tr className="border-b border-border text-[13px] text-ink-muted">
          <th scope="col" className="w-[30%] py-2 pr-2 font-medium sm:w-[24%]">
            Spek
          </th>
          <th scope="col" className="py-2 pr-2 font-medium">
            Mouse sekarang
          </th>
          <th scope="col" className="py-2 pr-2 font-medium">
            Incaran
          </th>
          <th scope="col" className="hidden py-2 font-medium sm:table-cell">
            Selisih
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key} className="border-b border-border align-top">
            <th scope="row" className="py-3 pr-2 font-normal text-ink-muted">
              {r.label}
            </th>
            <td className="py-3 pr-2 font-mono text-sm [overflow-wrap:anywhere] text-ink">
              {r.current}
            </td>
            <td className="py-3 pr-2 font-mono text-sm [overflow-wrap:anywhere] text-ink">
              {r.target}
              {r.diff && (
                <span className="mt-1 block text-[13px] text-ink-muted sm:hidden">{r.diff}</span>
              )}
            </td>
            <td className="hidden py-3 font-mono text-sm text-ink-muted sm:table-cell">
              {r.diff ?? ''}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

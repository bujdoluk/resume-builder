/**
 * Invisible `<tr>` padding rows appended after a paginated table's real
 * rows so every page renders the same number of rows (and thus the same
 * height) regardless of how many items are on it — otherwise a half-full
 * last page makes the pagination bar (and everything below it) jump
 * position compared to a full page, a layout shift on every page change.
 */
export default function TableFillerRows({
  count,
  textColumns,
  actionColumns,
}: {
  count: number;
  textColumns: number;
  actionColumns: number;
}) {
  if (count <= 0) return null;

  return (
    <>
      {Array.from({ length: count }, (_, rowIndex) => (
        <tr key={`filler-${rowIndex}`} aria-hidden="true">
          {Array.from({ length: textColumns }, (_, columnIndex) => (
            <td key={`text-${columnIndex}`} className="whitespace-nowrap">
              &nbsp;
            </td>
          ))}
          {Array.from({ length: actionColumns }, (_, columnIndex) => (
            <td key={`action-${columnIndex}`} className="w-px">
              <span className="btn btn-outline btn-sm invisible">&nbsp;</span>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

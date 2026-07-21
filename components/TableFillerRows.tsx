
export default function TableFillerRows({
  count,
  checkboxColumn = false,
  textColumns,
  actionColumns,
}: {
  count: number;
  checkboxColumn?: boolean;
  textColumns: number;
  actionColumns: number;
}) {
  if (count <= 0) return null;

  return (
    <>
      {Array.from({ length: count }, (_, rowIndex) => (
        <tr key={`filler-${rowIndex}`} aria-hidden="true">
          {checkboxColumn && (
            <td className="w-px">
              <input
                type="checkbox"
                className="checkbox checkbox-sm invisible"
                disabled
              />
            </td>
          )}
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

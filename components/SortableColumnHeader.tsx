"use client";

/**
 * Clickable `<table>` header cell content for a sortable column: a label
 * plus a chevron that points up/down for ascending/descending on the active
 * sort column. Shared by the `/my-resumes` and `/my-cover-letters` tables
 * (name/created/updated columns on both).
 */
import { ChevronDownIcon } from "@/components/Icons";

export interface TableSort<T extends string> {
  column: T;
  ascending: boolean;
}

export default function SortableColumnHeader<T extends string>({
  label,
  column,
  sort,
  onSort,
  ariaLabel,
}: {
  label: string;
  column: T;
  sort: TableSort<T>;
  onSort: (column: T) => void;
  ariaLabel: string;
}) {
  const isAscending = sort.column === column && sort.ascending;

  return (
    <button
      type="button"
      className="inline-flex items-center gap-1"
      aria-label={ariaLabel}
      onClick={() => onSort(column)}
    >
      {label}
      <ChevronDownIcon
        className={`h-4 w-4 stroke-current text-base-content transition-transform ${
          isAscending ? "rotate-180" : ""
        }`}
      />
    </button>
  );
}

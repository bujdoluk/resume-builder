"use client";

/**
 * Shared drag-and-drop primitives (built on `@dnd-kit`) used by the desktop
 * resume canvas (`Resume.tsx`) and the per-template mobile forms: `reorderEntries`
 * maps a dragged id order back onto entry objects, `SortableBlock`/
 * `SortableGroup` provide the draggable-row/drag-context wrappers, and
 * `renderFieldItems` walks a field order rendering each as a `SortableBlock`
 * while pairing photo+name/job-title and (optionally) packing contact
 * fields onto shared rows.
 */
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  type SortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "react-i18next";
import type { FieldKey } from "@/components/AppState";

// Rebuilds a repeatable-entry list (Work Experience, skills, languages, etc.)
// in the order produced by a SortableGroup drag — entries carry a stable
// `id` already, so dragging just needs to resolve ids back to their entries.
export function reorderEntries<T extends { id: string }>(
  entries: T[],
  order: string[],
): T[] {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  return order.map((id) => byId.get(id)!);
}

function GripIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}

// Wraps a single field/section block so it can be dragged directly on the
// resume canvas to reorder it — a grip handle appears in the left gutter on
// hover/focus instead of taking up space in the layout.
export function SortableBlock({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group/sortable relative ${className ?? ""}`}
    >
      <button
        type="button"
        aria-label={t("aria.reorder")}
        className="absolute top-0 -left-7 touch-none rounded p-1 text-gray-400 opacity-60 hover:bg-gray-100 hover:text-gray-600 focus:opacity-100 focus-visible:opacity-100 group-hover/sortable:opacity-100"
        {...attributes}
        {...listeners}
      >
        <GripIcon className="h-5 w-5" />
      </button>
      {children}
    </div>
  );
}

// Hosts one DndContext + SortableContext for a single reorderable group of
// blocks (a template's field list, or its section list). Each layout zone
// (e.g. Modern's sidebar vs main column) gets its own instance so dragging
// can't cross between zones that don't share a render order.
export function SortableGroup<T extends string>({
  dndId,
  ids,
  onReorder,
  strategy = verticalListSortingStrategy,
  children,
}: {
  dndId: string;
  ids: T[];
  onReorder: (order: T[]) => void;
  strategy?: SortingStrategy;
  children: React.ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(active.id as T);
    const newIndex = ids.indexOf(over.id as T);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(ids, oldIndex, newIndex));
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={strategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

// Contact fields that Minimal packs onto shared, wrapping rows instead of
// stacking one-per-line — mirrors the read-only MinimalTemplate.tsx.
export const contactFieldKeys: FieldKey[] = [
  "phone",
  "email",
  "address",
  "website",
  "linkedin",
];

// Renders a field order as SortableBlocks, one per field — except Photo,
// which visually pairs with Name/Job Title (photo left, text stacked right,
// height-matched to the photo) whenever they immediately follow it in the
// current order, and (when `wrapContactFields` is set, for Minimal) any
// immediately-consecutive run of contact fields, which shares a flex-wrap
// row instead of stacking. Each field keeps its own grip handle and stays
// independently draggable; dragging a field away from its neighbors just
// ends the pairing rather than disabling the drag.
export function renderFieldItems(
  order: FieldKey[],
  fieldContent: Partial<Record<FieldKey, React.ReactNode>>,
  options?: { wrapContactFields?: boolean },
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < order.length) {
    const key = order[i];

    if (key === "photo" && fieldContent.photo) {
      const pairedKeys: FieldKey[] = [];
      let j = i + 1;
      while (
        j < order.length &&
        (order[j] === "name" || order[j] === "jobTitle") &&
        fieldContent[order[j]]
      ) {
        pairedKeys.push(order[j]);
        j++;
      }

      if (pairedKeys.length > 0) {
        nodes.push(
          <div key={key} className="flex items-stretch gap-4">
            <div className="pr-4">
              <SortableBlock id="photo">{fieldContent.photo}</SortableBlock>
            </div>
            <div className="flex flex-1 flex-col justify-center gap-1">
              {pairedKeys.map((pairedKey) => (
                <SortableBlock key={pairedKey} id={pairedKey}>
                  {fieldContent[pairedKey]}
                </SortableBlock>
              ))}
            </div>
          </div>,
        );
        i = j;
        continue;
      }
    }

    if (options?.wrapContactFields && contactFieldKeys.includes(key)) {
      const rowKeys: FieldKey[] = [];
      let j = i;
      while (
        j < order.length &&
        contactFieldKeys.includes(order[j]) &&
        fieldContent[order[j]]
      ) {
        rowKeys.push(order[j]);
        j++;
      }

      if (rowKeys.length > 1) {
        nodes.push(
          <div key={key} className="flex flex-wrap gap-x-4 gap-y-2">
            {rowKeys.map((rowKey) => (
              <SortableBlock
                key={rowKey}
                id={rowKey}
                className="min-w-[220px] flex-1"
              >
                {fieldContent[rowKey]}
              </SortableBlock>
            ))}
          </div>,
        );
        i = j;
        continue;
      }
    }

    nodes.push(
      <SortableBlock key={key} id={key}>
        {fieldContent[key]}
      </SortableBlock>,
    );
    i++;
  }

  return nodes;
}

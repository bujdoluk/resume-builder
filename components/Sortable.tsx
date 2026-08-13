"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
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
import { contactFieldKeys } from "@/lib/resumeContent";

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

export function SortableBlock({
  id,
  className,
  anchor = false,
  children,
}: {
  id: string;
  className?: string;

  anchor?: boolean;
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
      data-section-anchor={anchor ? id : undefined}
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

export function SortableZones<Z extends string, T extends string>({
  dndId,
  zones,
  onChange,
  children,
}: {
  dndId: string;
  zones: Record<Z, T[]>;
  onChange: (next: Record<Z, T[]>) => void;
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
    if (!over) return;

    const activeId = active.id as T;
    const overId = over.id as string;
    const zoneEntries = Object.entries(zones) as [Z, T[]][];

    const sourceEntry = zoneEntries.find(([, ids]) => ids.includes(activeId));
    if (!sourceEntry) return;
    const [sourceZone, sourceIds] = sourceEntry;

    const directZoneMatch = zoneEntries.find(([zoneId]) => zoneId === overId);
    const overEntry = directZoneMatch
      ? [directZoneMatch[0], zones[directZoneMatch[0]].length] as const
      : (() => {
          const found = zoneEntries.find(([, ids]) => ids.includes(overId as T));
          return found ? ([found[0], found[1].indexOf(overId as T)] as const) : undefined;
        })();
    if (!overEntry) return;
    const [targetZone, targetIndex] = overEntry;

    if (targetZone === sourceZone) {
      const oldIndex = sourceIds.indexOf(activeId);
      if (oldIndex === -1 || oldIndex === targetIndex) return;
      onChange({ ...zones, [sourceZone]: arrayMove(sourceIds, oldIndex, targetIndex) });
      return;
    }

    const newSourceIds = sourceIds.filter((id) => id !== activeId);
    const newTargetIds = [...zones[targetZone]];
    newTargetIds.splice(Math.min(targetIndex, newTargetIds.length), 0, activeId);

    onChange({
      ...zones,
      [sourceZone]: newSourceIds,
      [targetZone]: newTargetIds,
    });
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      {children}
    </DndContext>
  );
}

export function SortableZone<T extends string>({
  zoneId,
  ids,
  strategy = verticalListSortingStrategy,
  className,
  children,
}: {
  zoneId: string;
  ids: T[];
  strategy?: SortingStrategy;
  className?: string;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id: zoneId });

  return (
    <div ref={setNodeRef} className={className}>
      <SortableContext items={ids} strategy={strategy}>
        {children}
      </SortableContext>
    </div>
  );
}

export function renderFieldItems(
  order: FieldKey[],
  fieldContent: Partial<Record<FieldKey, React.ReactNode>>,
  options?: { wrapContactFields?: boolean },
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < order.length) {
    const key = order[i];
    if (key === undefined) break;

    if (key === "photo" && fieldContent.photo) {
      const pairedKeys: FieldKey[] = [];
      let j = i + 1;
      while (j < order.length) {
        const nextKey = order[j];
        if ((nextKey !== "name" && nextKey !== "jobTitle") || !fieldContent[nextKey]) break;
        pairedKeys.push(nextKey);
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
      while (j < order.length) {
        const nextKey = order[j];
        if (nextKey === undefined || !contactFieldKeys.includes(nextKey) || !fieldContent[nextKey]) break;
        rowKeys.push(nextKey);
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

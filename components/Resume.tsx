"use client";

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
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  type SortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import type { FieldKey } from "@/components/AppState";
import { AboutMeIcon } from "@/components/Icons";
import { getContrastTextColor } from "@/lib/color";
import { getFontSizeStyle, type FontSizeKey } from "@/lib/fontSize";
import { fontsByKey, type FontKey } from "@/lib/fonts";
import {
  emptyResumeData,
  languageLevels,
  sectionLabels,
  type CertificationEntry,
  type EducationEntry,
  type LanguageEntry,
  type ResumeData,
  type SectionKey,
  type SimpleEntry,
  type WorkEntry,
} from "@/lib/resumeData";
import type { TemplateId } from "@/lib/templates";

export {
  emptyResumeData,
  languageLevels,
  sectionLabels,
  type CertificationEntry,
  type EducationEntry,
  type LanguageEntry,
  type ResumeData,
  type SectionKey,
  type SimpleEntry,
  type WorkEntry,
};

interface ResumeProps {
  data: ResumeData;
  onChange: (field: keyof ResumeData, value: string) => void;
  onWorkHistoryChange: (workExperience: WorkEntry[]) => void;
  onEducationChange: (education: EducationEntry[]) => void;
  onSkillsChange: (skills: SimpleEntry[]) => void;
  onCertificationsChange: (certifications: CertificationEntry[]) => void;
  onLanguagesChange: (languages: LanguageEntry[]) => void;
  onInterestsChange: (interests: SimpleEntry[]) => void;
  sectionOrder: SectionKey[];
  onRemoveSection: (key: SectionKey) => void;
  onReorderSections: (order: SectionKey[]) => void;
  templateId: TemplateId;
  color: string | null;
  font: FontKey | null;
  fontSize: FontSizeKey;
  visibleFields: FieldKey[];
  onReorderFields: (order: FieldKey[]) => void;
}

// Sections that render in the Modern template's sidebar column instead of
// the main column. Mirrors the grouping in components/templates/ModernTemplate.tsx.
const modernSidebarKeys: SectionKey[] = [
  "skills",
  "certifications",
  "languages",
];

// Personal-info fields that render in the Modern template's main column
// instead of the sidebar — About Me stays spatially just before Work
// History, which itself lives in the main column for Modern.
const modernMainFieldKeys: FieldKey[] = ["aboutMe"];

// The sub-fields within a single entry card (e.g. one Work Experience entry)
// are also individually draggable in the editing form. Order is shared
// across every entry of that type, same as the top-level fields/sections —
// this only affects the editable form; the read-only Preview/PDF templates
// keep their own fixed, per-template composition of these values.
type WorkEntryFieldKey =
  | "position"
  | "dateFrom"
  | "dateTo"
  | "location"
  | "jobDescription";
const defaultWorkHistoryFieldOrder: WorkEntryFieldKey[] = [
  "position",
  "dateFrom",
  "dateTo",
  "location",
  "jobDescription",
];

type EducationEntryFieldKey =
  | "subject"
  | "dateFrom"
  | "dateTo"
  | "location"
  | "description";
const defaultEducationFieldOrder: EducationEntryFieldKey[] = [
  "subject",
  "dateFrom",
  "dateTo",
  "location",
  "description",
];

type LanguageEntryFieldKey = "language" | "level";
const defaultLanguageFieldOrder: LanguageEntryFieldKey[] = [
  "language",
  "level",
];

type CertificationEntryFieldKey = "name" | "date";
const defaultCertificationFieldOrder: CertificationEntryFieldKey[] = [
  "name",
  "date",
];

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
function SortableBlock({
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
function SortableGroup<T extends string>({
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
const contactFieldKeys: FieldKey[] = [
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
function renderFieldItems(
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

// Rebuilds a repeatable-entry list (Work Experience, skills, languages, etc.)
// in the order produced by a SortableGroup drag — entries carry a stable
// `id` already, so dragging just needs to resolve ids back to their entries.
function reorderEntries<T extends { id: string }>(
  entries: T[],
  order: string[],
): T[] {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  return order.map((id) => byId.get(id)!);
}

function RemoveButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="btn btn-square btn-ghost"
      onClick={onClick}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        className="h-4 w-4 stroke-current"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M6 18 18 6M6 6l12 12"
        />
      </svg>
    </button>
  );
}

function SectionHeader({
  icon,
  title,
  onRemoveSection,
  minimal = false,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  onRemoveSection: () => void;
  minimal?: boolean;
  color?: string | null;
}) {
  const { t } = useTranslation();
  const removeButton = (
    <button
      type="button"
      aria-label={t("aria.removeSection", { title })}
      className="btn btn-square btn-ghost btn-xs"
      onClick={onRemoveSection}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        className="h-4 w-4 stroke-current"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M5 7h14M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0-.8 12.2a2 2 0 0 1-2 1.8H7.8a2 2 0 0 1-2-1.8L5 7Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M10 11v6M14 11v6"
        />
      </svg>
    </button>
  );

  if (minimal) {
    return (
      <div
        className="border-primary mt-6 mb-3 flex items-center justify-between border-b-2 pb-1"
        style={color ? { borderColor: color } : undefined}
      >
        <h2 className="text-sm font-bold tracking-[0.2em] uppercase">
          {title}
        </h2>
        {removeButton}
      </div>
    );
  }

  return (
    <div className="mt-4 mb-2 flex items-center justify-between">
      <h2
        className="flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-500 uppercase"
        style={color ? { color } : undefined}
      >
        {icon}
        {title}
      </h2>
      {removeButton}
    </div>
  );
}

export default function Resume({
  data,
  onChange,
  onWorkHistoryChange,
  onEducationChange,
  onSkillsChange,
  onCertificationsChange,
  onLanguagesChange,
  onInterestsChange,
  sectionOrder,
  onRemoveSection,
  onReorderSections,
  templateId,
  color,
  font,
  fontSize,
  visibleFields,
  onReorderFields,
}: ResumeProps) {
  const { t } = useTranslation();
  const fontFamily = font ? fontsByKey[font].variable : undefined;
  const fontSizeStyle = getFontSizeStyle(fontSize);

  const [workHistoryFieldOrder, setWorkHistoryFieldOrder] = useState(
    defaultWorkHistoryFieldOrder,
  );
  const [educationFieldOrder, setEducationFieldOrder] = useState(
    defaultEducationFieldOrder,
  );
  const [languageFieldOrder, setLanguageFieldOrder] = useState(
    defaultLanguageFieldOrder,
  );
  const [certificationFieldOrder, setCertificationFieldOrder] = useState(
    defaultCertificationFieldOrder,
  );

  // Where About Me sits among Modern's main-column sections (Work Experience,
  // Education, Interests) — an index rather than a full merged order, so it
  // stays correct as sections are toggled on/off without extra bookkeeping.
  const [aboutMeMainIndex, setAboutMeMainIndex] = useState(0);

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange("photo", reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function addWorkEntry() {
    onWorkHistoryChange([
      ...data.workExperience,
      {
        id: crypto.randomUUID(),
        position: "",
        dateFrom: "",
        dateTo: "",
        location: "",
        jobDescription: "",
      },
    ]);
  }

  function updateWorkEntry(
    id: string,
    field: Exclude<keyof WorkEntry, "id">,
    value: string,
  ) {
    onWorkHistoryChange(
      data.workExperience.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry,
      ),
    );
  }

  function removeWorkEntry(id: string) {
    onWorkHistoryChange(data.workExperience.filter((entry) => entry.id !== id));
  }

  function workEntryFields(
    entry: WorkEntry,
  ): Record<WorkEntryFieldKey, React.ReactNode> {
    return {
      position: (
        <fieldset className="fieldset">
          <input
            type="text"
            placeholder={t("placeholders.yourPosition")}
            className="input input-plain w-full"
            value={entry.position}
            onChange={(e) =>
              updateWorkEntry(entry.id, "position", e.target.value)
            }
          />
        </fieldset>
      ),
      dateFrom: (
        <fieldset className="fieldset">
          <input
            type="text"
            placeholder={t("placeholders.startDateWork")}
            className="input input-plain w-full"
            value={entry.dateFrom}
            onChange={(e) =>
              updateWorkEntry(entry.id, "dateFrom", e.target.value)
            }
          />
        </fieldset>
      ),
      dateTo: (
        <fieldset className="fieldset">
          <input
            type="text"
            placeholder={t("placeholders.endDateWork")}
            className="input input-plain w-full"
            value={entry.dateTo}
            onChange={(e) =>
              updateWorkEntry(entry.id, "dateTo", e.target.value)
            }
          />
        </fieldset>
      ),
      location: (
        <fieldset className="fieldset">
          <input
            type="text"
            placeholder="Location"
            className="input input-plain w-full"
            value={entry.location}
            onChange={(e) =>
              updateWorkEntry(entry.id, "location", e.target.value)
            }
          />
        </fieldset>
      ),
      jobDescription: (
        <fieldset className="fieldset">
          <textarea
            placeholder={t("placeholders.describeResponsibilities")}
            className="textarea input-plain w-full"
            rows={4}
            value={entry.jobDescription}
            onChange={(e) =>
              updateWorkEntry(entry.id, "jobDescription", e.target.value)
            }
          />
        </fieldset>
      ),
    };
  }

  function addEducationEntry() {
    onEducationChange([
      ...data.education,
      {
        id: crypto.randomUUID(),
        subject: "",
        location: "",
        description: "",
        dateFrom: "",
        dateTo: "",
      },
    ]);
  }

  function updateEducationEntry(
    id: string,
    field: Exclude<keyof EducationEntry, "id">,
    value: string,
  ) {
    onEducationChange(
      data.education.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry,
      ),
    );
  }

  function removeEducationEntry(id: string) {
    onEducationChange(data.education.filter((entry) => entry.id !== id));
  }

  function educationEntryFields(
    entry: EducationEntry,
  ): Record<EducationEntryFieldKey, React.ReactNode> {
    return {
      subject: (
        <fieldset className="fieldset">
          <input
            type="text"
            placeholder={t("placeholders.subjectOfStudy")}
            className="input input-plain w-full"
            value={entry.subject}
            onChange={(e) =>
              updateEducationEntry(entry.id, "subject", e.target.value)
            }
          />
        </fieldset>
      ),
      dateFrom: (
        <fieldset className="fieldset">
          <input
            type="text"
            placeholder={t("placeholders.startDateEducation")}
            className="input input-plain w-full"
            value={entry.dateFrom}
            onChange={(e) =>
              updateEducationEntry(entry.id, "dateFrom", e.target.value)
            }
          />
        </fieldset>
      ),
      dateTo: (
        <fieldset className="fieldset">
          <input
            type="text"
            placeholder={t("placeholders.endDateEducation")}
            className="input input-plain w-full"
            value={entry.dateTo}
            onChange={(e) =>
              updateEducationEntry(entry.id, "dateTo", e.target.value)
            }
          />
        </fieldset>
      ),
      location: (
        <fieldset className="fieldset">
          <input
            type="text"
            placeholder="Location"
            className="input input-plain w-full"
            value={entry.location}
            onChange={(e) =>
              updateEducationEntry(entry.id, "location", e.target.value)
            }
          />
        </fieldset>
      ),
      description: (
        <fieldset className="fieldset">
          <textarea
            placeholder={t("placeholders.describeStudies")}
            className="textarea input-plain w-full"
            rows={4}
            value={entry.description}
            onChange={(e) =>
              updateEducationEntry(entry.id, "description", e.target.value)
            }
          />
        </fieldset>
      ),
    };
  }

  function addSkill() {
    onSkillsChange([...data.skills, { id: crypto.randomUUID(), value: "" }]);
  }

  function updateSkill(id: string, value: string) {
    onSkillsChange(
      data.skills.map((entry) =>
        entry.id === id ? { ...entry, value } : entry,
      ),
    );
  }

  function removeSkill(id: string) {
    onSkillsChange(data.skills.filter((entry) => entry.id !== id));
  }

  function addCertification() {
    onCertificationsChange([
      ...data.certifications,
      { id: crypto.randomUUID(), name: "", date: "" },
    ]);
  }

  function updateCertification(
    id: string,
    field: "name" | "date",
    value: string,
  ) {
    onCertificationsChange(
      data.certifications.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry,
      ),
    );
  }

  function removeCertification(id: string) {
    onCertificationsChange(
      data.certifications.filter((entry) => entry.id !== id),
    );
  }

  function certificationEntryFields(
    entry: CertificationEntry,
  ): Record<CertificationEntryFieldKey, React.ReactNode> {
    return {
      name: (
        <fieldset className="fieldset">
          <input
            type="text"
            placeholder={t("placeholders.certificationName")}
            className="input w-full"
            value={entry.name}
            onChange={(e) =>
              updateCertification(entry.id, "name", e.target.value)
            }
          />
        </fieldset>
      ),
      date: (
        <fieldset className="fieldset">
          <input
            type="text"
            placeholder={t("placeholders.date")}
            className="input w-full"
            value={entry.date}
            onChange={(e) =>
              updateCertification(entry.id, "date", e.target.value)
            }
          />
        </fieldset>
      ),
    };
  }

  function addLanguage() {
    onLanguagesChange([
      ...data.languages,
      { id: crypto.randomUUID(), language: "", level: languageLevels[0] },
    ]);
  }

  function updateLanguage(
    id: string,
    field: "language" | "level",
    value: string,
  ) {
    onLanguagesChange(
      data.languages.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry,
      ),
    );
  }

  function removeLanguage(id: string) {
    onLanguagesChange(data.languages.filter((entry) => entry.id !== id));
  }

  function languageEntryFields(
    entry: LanguageEntry,
  ): Record<LanguageEntryFieldKey, React.ReactNode> {
    const levelIndex = languageLevels.indexOf(entry.level);

    return {
      language: (
        <fieldset className="fieldset">
          <input
            type="text"
            placeholder={t("placeholders.yourLanguage")}
            className="input w-full"
            value={entry.language}
            onChange={(e) =>
              updateLanguage(entry.id, "language", e.target.value)
            }
          />
        </fieldset>
      ),
      level: (
        <fieldset className="fieldset">
          <div
            className="flex items-center gap-2"
            aria-label="Language proficiency level"
          >
            <span className="text-xs whitespace-nowrap text-gray-500">
              {entry.level}
            </span>
            <div className="rating">
              {languageLevels.map((level, index) => (
                <input
                  key={level}
                  type="radio"
                  name={`language-level-${entry.id}`}
                  aria-label={level}
                  className="mask mask-star"
                  checked={index === levelIndex}
                  onChange={() => updateLanguage(entry.id, "level", level)}
                />
              ))}
            </div>
          </div>
        </fieldset>
      ),
    };
  }

  function addInterest() {
    onInterestsChange([
      ...data.interests,
      { id: crypto.randomUUID(), value: "" },
    ]);
  }

  function updateInterest(id: string, value: string) {
    onInterestsChange(
      data.interests.map((entry) =>
        entry.id === id ? { ...entry, value } : entry,
      ),
    );
  }

  function removeInterest(id: string) {
    onInterestsChange(data.interests.filter((entry) => entry.id !== id));
  }

  const entryCardClass =
    templateId === "minimal"
      ? "border-primary/40 flex flex-col gap-2 border-l-2 pl-3"
      : "flex flex-col gap-2 rounded-lg p-4";

  const sectionContent: Record<SectionKey, React.ReactNode> = {
    workExperience: (
      <>
        <SectionHeader
          title={t("sections.workExperience")}
          onRemoveSection={() => onRemoveSection("workExperience")}
          minimal={templateId === "minimal"}
          color={color}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="h-6 w-6 stroke-current"
            >
              <rect
                x="3"
                y="7.5"
                width="18"
                height="12"
                rx="1.5"
                strokeWidth="1.5"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M3 12.75h18"
              />
            </svg>
          }
        />

        <div className="flex flex-col gap-4">
          {data.workExperience.map((entry) => {
            const fields = workEntryFields(entry);
            return (
              <div key={entry.id} className={entryCardClass}>
                <div className="flex justify-end">
                  <RemoveButton
                    label={t("aria.removeWorkExperience")}
                    onClick={() => removeWorkEntry(entry.id)}
                  />
                </div>
                <SortableGroup
                  dndId={`work-history-fields-${entry.id}`}
                  ids={workHistoryFieldOrder}
                  onReorder={setWorkHistoryFieldOrder}
                >
                  {workHistoryFieldOrder.map((key) => (
                    <SortableBlock key={key} id={key}>
                      {fields[key]}
                    </SortableBlock>
                  ))}
                </SortableGroup>
              </div>
            );
          })}

          <button
            type="button"
            className="btn btn-outline btn-sm w-fit"
            onClick={addWorkEntry}
          >
            {t("buttons.addWorkExperience")}
          </button>
        </div>
      </>
    ),

    education: (
      <>
        <SectionHeader
          title={t("sections.education")}
          onRemoveSection={() => onRemoveSection("education")}
          minimal={templateId === "minimal"}
          color={color}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="h-6 w-6 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="m2.25 9 9.75-4.5L21.75 9l-9.75 4.5L2.25 9Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M6 11.25v4.5c0 .621 2.686 2.25 6 2.25s6-1.629 6-2.25v-4.5"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M21.75 9v6"
              />
            </svg>
          }
        />

        <div className="flex flex-col gap-4">
          {data.education.map((entry) => {
            const fields = educationEntryFields(entry);
            return (
              <div key={entry.id} className={entryCardClass}>
                <div className="flex justify-end">
                  <RemoveButton
                    label={t("aria.removeEducation")}
                    onClick={() => removeEducationEntry(entry.id)}
                  />
                </div>
                <SortableGroup
                  dndId={`education-fields-${entry.id}`}
                  ids={educationFieldOrder}
                  onReorder={setEducationFieldOrder}
                >
                  {educationFieldOrder.map((key) => (
                    <SortableBlock key={key} id={key}>
                      {fields[key]}
                    </SortableBlock>
                  ))}
                </SortableGroup>
              </div>
            );
          })}

          <button
            type="button"
            className="btn btn-outline btn-sm w-fit"
            onClick={addEducationEntry}
          >
            {t("buttons.addEducation")}
          </button>
        </div>
      </>
    ),

    skills: (
      <>
        <SectionHeader
          title={t("sections.skills")}
          onRemoveSection={() => onRemoveSection("skills")}
          minimal={templateId === "minimal"}
          color={color}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="h-6 w-6 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="m11.48 3.499 2.078 4.5 4.94.719c1.02.148 1.427 1.408.69 2.125l-3.573 3.482.843 4.92c.174 1.016-.9 1.79-1.816 1.31L12 18.354l-4.421 2.326c-.916.48-1.99-.294-1.816-1.31l.843-4.92-3.573-3.482c-.737-.717-.33-1.977.69-2.125l4.94-.719 2.078-4.5c.457-.99 1.902-.99 2.36 0Z"
              />
            </svg>
          }
        />

        <div className="flex flex-col gap-2">
          <SortableGroup
            dndId="skills-entries"
            ids={data.skills.map((entry) => entry.id)}
            onReorder={(order) =>
              onSkillsChange(reorderEntries(data.skills, order))
            }
          >
            {data.skills.map((entry) => (
              <SortableBlock key={entry.id} id={entry.id}>
                <div className="flex items-end gap-2">
                  <fieldset className="fieldset flex-1">
                    <input
                      type="text"
                      placeholder={t("placeholders.yourSkill")}
                      className="input w-full"
                      value={entry.value}
                      onChange={(e) => updateSkill(entry.id, e.target.value)}
                    />
                  </fieldset>
                  <RemoveButton
                    label={t("aria.removeSkill")}
                    onClick={() => removeSkill(entry.id)}
                  />
                </div>
              </SortableBlock>
            ))}
          </SortableGroup>

          <button
            type="button"
            className="btn btn-outline btn-sm w-fit"
            onClick={addSkill}
          >
            {t("buttons.addSkill")}
          </button>
        </div>
      </>
    ),

    certifications: (
      <>
        <SectionHeader
          title={t("sections.certifications")}
          onRemoveSection={() => onRemoveSection("certifications")}
          minimal={templateId === "minimal"}
          color={color}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="h-6 w-6 stroke-current"
            >
              <circle cx="12" cy="8" r="5" strokeWidth="1.5" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="m8.5 12.5-1.5 7 5-3 5 3-1.5-7"
              />
            </svg>
          }
        />

        <div className="flex flex-col gap-2">
          <SortableGroup
            dndId="certifications-entries"
            ids={data.certifications.map((entry) => entry.id)}
            onReorder={(order) =>
              onCertificationsChange(
                reorderEntries(data.certifications, order),
              )
            }
          >
            {data.certifications.map((entry) => {
              const fields = certificationEntryFields(entry);
              return (
                <SortableBlock key={entry.id} id={entry.id}>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-end">
                      <RemoveButton
                        label={t("aria.removeCertification")}
                        onClick={() => removeCertification(entry.id)}
                      />
                    </div>
                    <SortableGroup
                      dndId={`certification-fields-${entry.id}`}
                      ids={certificationFieldOrder}
                      onReorder={setCertificationFieldOrder}
                    >
                      {certificationFieldOrder.map((key) => (
                        <SortableBlock key={key} id={key}>
                          {fields[key]}
                        </SortableBlock>
                      ))}
                    </SortableGroup>
                  </div>
                </SortableBlock>
              );
            })}
          </SortableGroup>

          <button
            type="button"
            className="btn btn-outline btn-sm w-fit"
            onClick={addCertification}
          >
            {t("buttons.addCertification")}
          </button>
        </div>
      </>
    ),

    languages: (
      <>
        <SectionHeader
          title={t("sections.languages")}
          onRemoveSection={() => onRemoveSection("languages")}
          minimal={templateId === "minimal"}
          color={color}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="h-6 w-6 stroke-current"
            >
              <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M3 12h18M12 3c2.5 2.5 3.75 5.5 3.75 9s-1.25 6.5-3.75 9c-2.5-2.5-3.75-5.5-3.75-9S9.5 5.5 12 3Z"
              />
            </svg>
          }
        />

        <div className="flex flex-col gap-2">
          <SortableGroup
            dndId="languages-entries"
            ids={data.languages.map((entry) => entry.id)}
            onReorder={(order) =>
              onLanguagesChange(reorderEntries(data.languages, order))
            }
          >
            {data.languages.map((entry) => {
              const fields = languageEntryFields(entry);
              return (
                <SortableBlock key={entry.id} id={entry.id}>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-end">
                      <RemoveButton
                        label={t("aria.removeLanguage")}
                        onClick={() => removeLanguage(entry.id)}
                      />
                    </div>
                    <SortableGroup
                      dndId={`language-fields-${entry.id}`}
                      ids={languageFieldOrder}
                      onReorder={setLanguageFieldOrder}
                    >
                      {languageFieldOrder.map((key) => (
                        <SortableBlock key={key} id={key}>
                          {fields[key]}
                        </SortableBlock>
                      ))}
                    </SortableGroup>
                  </div>
                </SortableBlock>
              );
            })}
          </SortableGroup>

          <button
            type="button"
            className="btn btn-outline btn-sm w-fit"
            onClick={addLanguage}
          >
            {t("buttons.addLanguage")}
          </button>
        </div>
      </>
    ),

    interests: (
      <>
        <SectionHeader
          title={t("sections.interests")}
          onRemoveSection={() => onRemoveSection("interests")}
          minimal={templateId === "minimal"}
          color={color}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="h-6 w-6 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M12 20.25c-.318 0-.633-.088-.906-.262C7.499 17.577 3 14.15 3 9.75 3 7.026 5.132 4.9 7.79 4.9c1.6 0 3.049.789 3.96 2.017a.7.7 0 0 0 .5.208.7.7 0 0 0 .5-.208A4.897 4.897 0 0 1 16.71 4.9C19.368 4.9 21.5 7.026 21.5 9.75c0 4.4-4.5 7.827-8.594 10.238-.273.174-.588.262-.906.262Z"
              />
            </svg>
          }
        />

        <div className="flex flex-col gap-2">
          <SortableGroup
            dndId="interests-entries"
            ids={data.interests.map((entry) => entry.id)}
            onReorder={(order) =>
              onInterestsChange(reorderEntries(data.interests, order))
            }
          >
            {data.interests.map((entry) => (
              <SortableBlock key={entry.id} id={entry.id}>
                <div className="flex items-end gap-2">
                  <fieldset className="fieldset flex-1">
                    <input
                      type="text"
                      placeholder={t("placeholders.yourInterest")}
                      className="input w-full"
                      value={entry.value}
                      onChange={(e) =>
                        updateInterest(entry.id, e.target.value)
                      }
                    />
                  </fieldset>
                  <RemoveButton
                    label={t("aria.removeInterest")}
                    onClick={() => removeInterest(entry.id)}
                  />
                </div>
              </SortableBlock>
            ))}
          </SortableGroup>

          <button
            type="button"
            className="btn btn-outline btn-sm w-fit"
            onClick={addInterest}
          >
            {t("buttons.addInterest")}
          </button>
        </div>
      </>
    ),
  };

  const avatarBgClass =
    templateId === "modern"
      ? "bg-white text-neutral"
      : "bg-neutral text-neutral-content";

  const avatar = !visibleFields.includes("photo") ? null : (
    <div className={templateId === "modern" ? "flex justify-center" : undefined}>
      <label
        className="avatar avatar-placeholder cursor-pointer items-center justify-center"
        aria-label={t("aria.uploadProfilePhoto")}
      >
        <div className={`h-32 w-32 rounded-full ${avatarBgClass}`}>
          {data.photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- user-uploaded data URL, not an optimizable static asset
            <img
              src={data.photo}
              alt="Profile photo"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="h-10 w-10 stroke-current"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M12 16.5V4.5m0 0-4 4m4-4 4 4M4.5 16.5v2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2"
                />
              </svg>
              <span className="text-xs font-medium">{t("placeholders.uploadPhoto")}</span>
            </div>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />
      </label>
    </div>
  );

  const name = !visibleFields.includes("name") ? null : (
    <fieldset className="fieldset">
      <input
        type="text"
        name="name"
        placeholder={t("placeholders.yourName")}
        className="input w-full"
        value={data.name}
        onChange={(e) => onChange("name", e.target.value)}
      />
    </fieldset>
  );

  const jobTitle = !visibleFields.includes("jobTitle") ? null : (
    <fieldset className="fieldset">
      <input
        type="text"
        name="jobTitle"
        placeholder={t("placeholders.yourJobTitle")}
        className="input w-full"
        value={data.jobTitle}
        onChange={(e) => onChange("jobTitle", e.target.value)}
      />
    </fieldset>
  );

  const phone = !visibleFields.includes("phone") ? null : (
    <fieldset className="fieldset">
      <label className="input w-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="h-6 w-6 shrink-0 stroke-current text-gray-500"
          style={color ? { color } : undefined}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M2.25 6.75c0 8.284 6.716 15 15 15h1.5a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293a12.045 12.045 0 0 1-5.688-5.688l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
          />
        </svg>
        <input
          type="tel"
          name="phone"
          placeholder={t("placeholders.yourPhone")}
          className="grow"
          value={data.phone}
          onChange={(e) => onChange("phone", e.target.value)}
        />
      </label>
    </fieldset>
  );

  const email = !visibleFields.includes("email") ? null : (
    <fieldset className="fieldset">
      <label className="input w-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="h-6 w-6 shrink-0 stroke-current text-gray-500"
          style={color ? { color } : undefined}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
          />
        </svg>
        <input
          type="email"
          name="email"
          placeholder={t("placeholders.yourEmail")}
          className="grow"
          value={data.email}
          onChange={(e) => onChange("email", e.target.value)}
        />
      </label>
    </fieldset>
  );

  const address = !visibleFields.includes("address") ? null : (
    <fieldset className="fieldset">
      <label className="input w-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="h-6 w-6 shrink-0 stroke-current text-gray-500"
          style={color ? { color } : undefined}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
          />
        </svg>
        <input
          type="text"
          name="address"
          placeholder={t("placeholders.yourAddress")}
          className="grow"
          value={data.address}
          onChange={(e) => onChange("address", e.target.value)}
        />
      </label>
    </fieldset>
  );

  const website = !visibleFields.includes("website") ? null : (
    <fieldset className="fieldset">
      <label className="input w-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="h-6 w-6 shrink-0 stroke-current text-gray-500"
          style={color ? { color } : undefined}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A8.959 8.959 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
          />
        </svg>
        <input
          type="text"
          name="website"
          placeholder={t("placeholders.yourWebsite")}
          className="grow"
          value={data.website}
          onChange={(e) => onChange("website", e.target.value)}
        />
      </label>
    </fieldset>
  );

  const linkedin = !visibleFields.includes("linkedin") ? null : (
    <fieldset className="fieldset">
      <label className="input w-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="h-6 w-6 shrink-0 stroke-current text-gray-500"
          style={color ? { color } : undefined}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
          />
        </svg>
        <input
          type="text"
          name="linkedin"
          placeholder={t("placeholders.yourLinkedIn")}
          className="grow"
          value={data.linkedin}
          onChange={(e) => onChange("linkedin", e.target.value)}
        />
      </label>
    </fieldset>
  );

  const aboutMe = !visibleFields.includes("aboutMe") ? null : (
    <div>
      {templateId === "minimal" ? (
        <h2
          className="border-primary mt-6 mb-3 border-b-2 pb-1 text-sm font-bold tracking-[0.2em] uppercase"
          style={color ? { borderColor: color } : undefined}
        >
          {t("fields.aboutMe")}
        </h2>
      ) : (
        <div className="mt-4 mb-2 flex items-center gap-2">
          <AboutMeIcon
            className="h-6 w-6 shrink-0 stroke-current text-gray-500"
            style={color ? { color } : undefined}
          />
          <h2
            className="text-sm font-semibold tracking-wide text-gray-500 uppercase"
            style={color ? { color } : undefined}
          >
            {t("fields.aboutMe")}
          </h2>
        </div>
      )}
      <textarea
        placeholder={t("placeholders.aboutMe")}
        className="textarea textarea-plain w-full"
        rows={3}
        value={data.aboutMe}
        onChange={(e) => onChange("aboutMe", e.target.value)}
      />
    </div>
  );

  const fieldContent: Partial<Record<FieldKey, React.ReactNode>> = {
    photo: avatar,
    name,
    jobTitle,
    phone,
    email,
    address,
    website,
    linkedin,
    aboutMe,
  };

  if (templateId === "modern") {
    const sidebarFieldKeys = visibleFields.filter(
      (key) => !modernMainFieldKeys.includes(key),
    );
    const sidebarKeys = sectionOrder.filter((key) =>
      modernSidebarKeys.includes(key),
    );
    const mainSectionKeys = sectionOrder.filter(
      (key) => !modernSidebarKeys.includes(key),
    );

    // About Me is interleaved with the main-column sections here (instead of
    // always pinned first) so it can be dragged freely between Work Experience,
    // Education, and Interests.
    const aboutMeIndex = Math.min(aboutMeMainIndex, mainSectionKeys.length);
    const mainItems: (SectionKey | "aboutMe")[] = visibleFields.includes(
      "aboutMe",
    )
      ? [
          ...mainSectionKeys.slice(0, aboutMeIndex),
          "aboutMe",
          ...mainSectionKeys.slice(aboutMeIndex),
        ]
      : mainSectionKeys;

    function handleMainReorder(newOrder: (SectionKey | "aboutMe")[]) {
      const newAboutMeIndex = newOrder.indexOf("aboutMe");
      if (newAboutMeIndex !== -1) setAboutMeMainIndex(newAboutMeIndex);

      const newMainSectionKeys = newOrder.filter(
        (item): item is SectionKey => item !== "aboutMe",
      );
      onReorderSections([...sidebarKeys, ...newMainSectionKeys]);
    }

    return (
      <div
        className="resume-scalable grid w-[280mm] min-h-[297mm] grid-cols-[90mm_1fr] bg-white shadow-xl print:shadow-none"
        style={{ fontFamily, ...fontSizeStyle }}
      >
        <div
          className="modern-sidebar bg-neutral text-neutral-content flex flex-col gap-2 p-6 pl-8"
          style={
            color
              ? ({
                  backgroundColor: color,
                  color: getContrastTextColor(color),
                  "--sidebar-fg": getContrastTextColor(color),
                } as React.CSSProperties)
              : undefined
          }
        >
          <SortableGroup
            dndId="modern-sidebar-fields"
            ids={sidebarFieldKeys}
            onReorder={(order) =>
              onReorderFields([
                ...order,
                ...visibleFields.filter((key) =>
                  modernMainFieldKeys.includes(key),
                ),
              ])
            }
          >
            {sidebarFieldKeys.map((key) => (
              <SortableBlock key={key} id={key}>
                {fieldContent[key]}
              </SortableBlock>
            ))}
          </SortableGroup>

          <SortableGroup
            dndId="modern-sidebar-sections"
            ids={sidebarKeys}
            onReorder={(order) => onReorderSections([...order, ...mainSectionKeys])}
          >
            {sidebarKeys.map((key) => (
              <SortableBlock key={key} id={key}>
                {sectionContent[key]}
              </SortableBlock>
            ))}
          </SortableGroup>
        </div>

        <div className="p-6 pl-8">
          <SortableGroup
            dndId="modern-main"
            ids={mainItems}
            onReorder={handleMainReorder}
          >
            {mainItems.map((item) => (
              <SortableBlock key={item} id={item}>
                {item === "aboutMe" ? fieldContent.aboutMe : sectionContent[item]}
              </SortableBlock>
            ))}
          </SortableGroup>
        </div>
      </div>
    );
  }

  if (templateId === "minimal") {
    return (
      <div
        className="resume-scalable w-[280mm] min-h-[297mm] bg-white shadow-xl print:shadow-none"
        style={{ fontFamily, ...fontSizeStyle }}
      >
        <div className="p-10 pl-12">
          <SortableGroup
            dndId="minimal-fields"
            ids={visibleFields}
            onReorder={onReorderFields}
            strategy={rectSortingStrategy}
          >
            <div className="flex flex-col gap-2">
              {renderFieldItems(visibleFields, fieldContent, {
                wrapContactFields: true,
              })}
            </div>
          </SortableGroup>

          <SortableGroup
            dndId="minimal-sections"
            ids={sectionOrder}
            onReorder={onReorderSections}
          >
            {sectionOrder.map((key) => (
              <SortableBlock key={key} id={key}>
                {sectionContent[key]}
              </SortableBlock>
            ))}
          </SortableGroup>
        </div>
      </div>
    );
  }

  return (
    <div
      className="resume-scalable w-[280mm] min-h-[297mm] bg-white shadow-xl print:shadow-none"
      style={{ fontFamily, ...fontSizeStyle }}
    >
      <div className="p-8 pl-10">
        <SortableGroup
          dndId="basic-fields"
          ids={visibleFields}
          onReorder={onReorderFields}
        >
          <div className="flex flex-col gap-2">
            {renderFieldItems(visibleFields, fieldContent)}
          </div>
        </SortableGroup>

        <SortableGroup
          dndId="basic-sections"
          ids={sectionOrder}
          onReorder={onReorderSections}
        >
          {sectionOrder.map((key) => (
            <SortableBlock key={key} id={key}>
              {sectionContent[key]}
            </SortableBlock>
          ))}
        </SortableGroup>
      </div>
    </div>
  );
}

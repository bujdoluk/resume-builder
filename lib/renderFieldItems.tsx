
import { Fragment } from "react";
import type { FieldKey } from "@/lib/fields";
import { contactFieldKeys } from "@/lib/resumeContent";

export interface RenderFieldItemsOptions {
  photoRowClassName?: string;
  photoTextColClassName?: string;

  packContactFields?: boolean;
  contactRowClassName?: string;
}

export function renderFieldItems(
  order: FieldKey[],
  fieldContent: Partial<Record<FieldKey, React.ReactNode>>,
  options: RenderFieldItemsOptions = {},
): React.ReactNode[] {
  const {
    photoRowClassName,
    photoTextColClassName,
    packContactFields = false,
    contactRowClassName,
  } = options;

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
          <div key={key} className={photoRowClassName}>
            {fieldContent.photo}
            <div className={photoTextColClassName}>
              {pairedKeys.map((pairedKey) => (
                <Fragment key={pairedKey}>{fieldContent[pairedKey]}</Fragment>
              ))}
            </div>
          </div>,
        );
        i = j;
        continue;
      }
    }

    if (packContactFields && contactFieldKeys.includes(key)) {
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
          <div key={key} className={contactRowClassName}>
            {rowKeys.map((rowKey) => (
              <Fragment key={rowKey}>{fieldContent[rowKey]}</Fragment>
            ))}
          </div>,
        );
        i = j;
        continue;
      }
    }

    nodes.push(<Fragment key={key}>{fieldContent[key]}</Fragment>);
    i++;
  }

  return nodes;
}

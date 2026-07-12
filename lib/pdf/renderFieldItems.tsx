/**
 * `renderPdfFieldItems` ports `components/templates/BasicTemplate.tsx` and
 * `MinimalTemplate.tsx`'s `renderFieldItems` (photo/name/job-title pairing,
 * plus Minimal's contact-field row-packing) to `@react-pdf/renderer`
 * primitives, so the printed PDF's field order faithfully matches whatever
 * order the user actually drag-reordered on screen.
 */
import { View } from "@react-pdf/renderer";
import type { Style as PdfStyle } from "@react-pdf/stylesheet";
import type { FieldKey } from "@/lib/fields";

const defaultContactFieldKeys: FieldKey[] = [
  "phone",
  "email",
  "address",
  "website",
  "linkedin",
];

export interface RenderPdfFieldItemsOptions {
  photoRowStyle?: PdfStyle;
  photoTextColStyle?: PdfStyle;
  // Minimal packs consecutive contact fields onto one wrapping row; Basic
  // and Modern's sidebar don't.
  packContactFields?: boolean;
  contactRowStyle?: PdfStyle;
}

// Ports components/templates/BasicTemplate.tsx and MinimalTemplate.tsx's
// renderFieldItems (photo/name/job-title pairing, plus Minimal's
// contact-field row-packing) to react-pdf primitives — the on-screen
// versions render an ordered list of <div>s, this one an ordered list of
// <View>s, but the underlying "walk the user's actual drag-reordered field
// order, grouping photo+name/jobTitle and (optionally) contact fields"
// algorithm must stay identical, or the printed PDF silently stops matching
// whatever order the user actually arranged on screen.
export function renderPdfFieldItems(
  order: FieldKey[],
  fieldContent: Partial<Record<FieldKey, React.ReactNode>>,
  options: RenderPdfFieldItemsOptions = {},
): React.ReactNode[] {
  const {
    photoRowStyle,
    photoTextColStyle,
    packContactFields = false,
    contactRowStyle,
  } = options;

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
          <View key={key} style={photoRowStyle}>
            {fieldContent.photo}
            <View style={photoTextColStyle}>
              {pairedKeys.map((pairedKey) => (
                <View key={pairedKey}>{fieldContent[pairedKey]}</View>
              ))}
            </View>
          </View>,
        );
        i = j;
        continue;
      }
    }

    if (packContactFields && defaultContactFieldKeys.includes(key)) {
      const rowKeys: FieldKey[] = [];
      let j = i;
      while (
        j < order.length &&
        defaultContactFieldKeys.includes(order[j]) &&
        fieldContent[order[j]]
      ) {
        rowKeys.push(order[j]);
        j++;
      }

      if (rowKeys.length > 1) {
        nodes.push(
          <View key={key} style={contactRowStyle}>
            {rowKeys.map((rowKey) => (
              <View key={rowKey}>{fieldContent[rowKey]}</View>
            ))}
          </View>,
        );
        i = j;
        continue;
      }
    }

    nodes.push(<View key={key}>{fieldContent[key]}</View>);
    i++;
  }

  return nodes;
}

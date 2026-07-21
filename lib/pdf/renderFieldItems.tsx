
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

  packContactFields?: boolean;
  contactRowStyle?: PdfStyle;
}

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


import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { CoverLetterFieldKey } from "@/lib/coverLetterFields";
import type { CoverLetterData } from "@/lib/coverLetterData";
import type {
  CoverLetterSectionKey,
  CoverLetterSectionZones,
} from "@/lib/coverLetterSections";
import { getFontScaleRatio, type FontSizeKey } from "@/lib/fontSize";
import type { FontKey } from "@/lib/fonts";
import { GRAY_600, RESUME_TEXT_COLOR } from "@/lib/pdf/theme";

export interface CoverLetterPdfTemplateProps {
  data: CoverLetterData;
  color?: string | null;
  font?: FontKey | null;
  fontSize?: FontSizeKey;
  visibleFields?: CoverLetterFieldKey[];
  sectionOrder?: CoverLetterSectionKey[];
  sectionZones?: CoverLetterSectionZones;
}

export default function CoverLetterPdfTemplate({
  data,
  color,
  font,
  fontSize,
  visibleFields,
}: CoverLetterPdfTemplateProps) {
  const isVisible = (key: CoverLetterFieldKey) =>
    !visibleFields || visibleFields.includes(key);
  const scale = getFontScaleRatio(fontSize ?? "medium");
  const s = (px: number) => Math.round(px * scale * 10) / 10;
  const accentColor = color ?? undefined;
  const fontFamily = font ?? "inter";

  const styles = StyleSheet.create({
    page: {
      fontFamily,
      padding: 48,
      fontSize: s(10.5),
      color: RESUME_TEXT_COLOR,
    },
    senderName: { fontSize: s(13), fontWeight: "bold" },
    meta: { fontSize: s(9.5), color: GRAY_600, marginTop: 2 },
    block: { flexDirection: "column", gap: 2 },
    spacedBlock: { flexDirection: "column", gap: 2, marginTop: 24 },
    subject: {
      fontWeight: "bold",
      marginTop: 24,
      color: accentColor ?? RESUME_TEXT_COLOR,
    },
    greeting: { marginTop: 24 },
    body: { marginTop: 16, lineHeight: 1.5 },
    closingBlock: { flexDirection: "column", gap: 2, marginTop: 24 },
  });

  const senderName = isVisible("senderName") && data.senderName;
  const senderAddress = isVisible("senderAddress") && data.senderAddress;
  const senderPhone = isVisible("senderPhone") && data.senderPhone;
  const senderEmail = isVisible("senderEmail") && data.senderEmail;
  const date = isVisible("date") && data.date;
  const recipientName = isVisible("recipientName") && data.recipientName;
  const recipientCompany =
    isVisible("recipientCompany") && data.recipientCompany;
  const recipientState = isVisible("recipientState") && data.recipientState;
  const recipientZipCode =
    isVisible("recipientZipCode") && data.recipientZipCode;
  const recipientPhone = isVisible("recipientPhone") && data.recipientPhone;
  const recipientEmail = isVisible("recipientEmail") && data.recipientEmail;
  const subject = isVisible("subject") && data.subject;
  const greeting = isVisible("greeting") && data.greeting;
  const body = isVisible("body") && data.body;
  const closing = isVisible("closing") && data.closing;
  const signature = isVisible("signature") && data.senderName;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.block}>
          {senderName && <Text style={styles.senderName}>{senderName}</Text>}
          {senderAddress && <Text style={styles.meta}>{senderAddress}</Text>}
          {(senderPhone || senderEmail) && (
            <Text style={styles.meta}>
              {[senderPhone, senderEmail].filter(Boolean).join(" · ")}
            </Text>
          )}
        </View>

        {date && <Text style={[styles.meta, { marginTop: 24 }]}>{date}</Text>}

        <View style={styles.spacedBlock}>
          {recipientName && (
            <Text style={{ fontWeight: "bold" }}>{recipientName}</Text>
          )}
          {recipientCompany && (
            <Text style={styles.meta}>{recipientCompany}</Text>
          )}
          {(recipientState || recipientZipCode) && (
            <Text style={styles.meta}>
              {[recipientState, recipientZipCode].filter(Boolean).join(" ")}
            </Text>
          )}
          {(recipientPhone || recipientEmail) && (
            <Text style={styles.meta}>
              {[recipientPhone, recipientEmail].filter(Boolean).join(" · ")}
            </Text>
          )}
        </View>

        {subject && <Text style={styles.subject}>{subject}</Text>}

        {greeting && <Text style={styles.greeting}>{greeting}</Text>}

        {body && <Text style={styles.body}>{body}</Text>}

        {(closing || signature) && (
          <View style={styles.closingBlock}>
            {closing && <Text>{closing}</Text>}
            {signature && <Text>{signature}</Text>}
          </View>
        )}
      </Page>
    </Document>
  );
}

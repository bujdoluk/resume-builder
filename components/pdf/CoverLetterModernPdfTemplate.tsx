
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { CoverLetterPdfTemplateProps } from "@/components/pdf/CoverLetterPdfTemplate";
import { getContrastTextColor } from "@/lib/color";
import type { CoverLetterFieldKey } from "@/lib/coverLetterFields";
import {
  defaultCoverLetterSectionOrder,
  splitCoverLetterSectionsByZone,
  type CoverLetterSectionKey,
} from "@/lib/coverLetterSections";
import { getFontScaleRatio } from "@/lib/fontSize";
import { DAISYUI_NEUTRAL, DAISYUI_NEUTRAL_CONTENT, GRAY_600, RESUME_TEXT_COLOR } from "@/lib/pdf/theme";

export default function CoverLetterModernPdfTemplate({
  data,
  color,
  font,
  fontSize,
  visibleFields,
  sectionOrder,
  sectionZones,
}: CoverLetterPdfTemplateProps) {
  const isVisible = (key: CoverLetterFieldKey) =>
    !visibleFields || visibleFields.includes(key);
  const scale = getFontScaleRatio(fontSize ?? "medium");
  const s = (px: number) => Math.round(px * scale * 10) / 10;
  const accentColor = color ?? undefined;
  const sidebarBg = color ?? DAISYUI_NEUTRAL;
  const sidebarFg = color ? getContrastTextColor(color) : DAISYUI_NEUTRAL_CONTENT;
  const fontFamily = font ?? "inter";

  const styles = StyleSheet.create({
    page: { fontFamily, fontSize: s(10.5), color: RESUME_TEXT_COLOR, flexDirection: "row" },
    sidebar: {
      width: 180,
      backgroundColor: sidebarBg,
      color: sidebarFg,
      padding: 24,
    },
    main: { flex: 1, padding: 24 },
    block: { flexDirection: "column", gap: 2 },
    senderName: { fontSize: s(13), fontWeight: "bold" },
    meta: { fontSize: s(9.5), opacity: 0.7 },
    mainMeta: { fontSize: s(9.5), color: GRAY_600 },
    subject: { fontWeight: "bold", color: accentColor ?? RESUME_TEXT_COLOR },
    body: { lineHeight: 1.5 },
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

  function metaStyle(inSidebar: boolean) {
    return inSidebar ? styles.meta : styles.mainMeta;
  }

  const sectionContent: Partial<Record<CoverLetterSectionKey, (inSidebar: boolean) => React.ReactNode>> = {
    sender: (senderName || senderAddress || senderPhone || senderEmail)
      ? (inSidebar) => (
          <View style={styles.block}>
            {senderName && <Text style={styles.senderName}>{senderName}</Text>}
            {senderAddress && <Text style={metaStyle(inSidebar)}>{senderAddress}</Text>}
            {(senderPhone || senderEmail) && (
              <Text style={metaStyle(inSidebar)}>
                {[senderPhone, senderEmail].filter(Boolean).join(" · ")}
              </Text>
            )}
          </View>
        )
      : undefined,

    date: date ? (inSidebar) => <Text style={metaStyle(inSidebar)}>{date}</Text> : undefined,

    recipient: (recipientName ||
      recipientCompany ||
      recipientState ||
      recipientZipCode ||
      recipientPhone ||
      recipientEmail)
      ? (inSidebar) => (
          <View style={styles.block}>
            {recipientName && <Text style={{ fontWeight: "bold" }}>{recipientName}</Text>}
            {recipientCompany && <Text style={metaStyle(inSidebar)}>{recipientCompany}</Text>}
            {(recipientState || recipientZipCode) && (
              <Text style={metaStyle(inSidebar)}>
                {[recipientState, recipientZipCode].filter(Boolean).join(" ")}
              </Text>
            )}
            {(recipientPhone || recipientEmail) && (
              <Text style={metaStyle(inSidebar)}>
                {[recipientPhone, recipientEmail].filter(Boolean).join(" · ")}
              </Text>
            )}
          </View>
        )
      : undefined,

    subject: subject ? () => <Text style={styles.subject}>{subject}</Text> : undefined,

    letter: (greeting || body || closing || signature)
      ? () => (
          <View style={styles.block}>
            {greeting && <Text>{greeting}</Text>}
            {body && <Text style={styles.body}>{body}</Text>}
            {(closing || signature) && (
              <View style={styles.block}>
                {closing && <Text>{closing}</Text>}
                {signature && <Text>{signature}</Text>}
              </View>
            )}
          </View>
        )
      : undefined,
  };

  const order = sectionOrder ?? defaultCoverLetterSectionOrder;
  const { sidebar, main } = splitCoverLetterSectionsByZone(order, sectionZones ?? {});

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.sidebar}>
          {sidebar.map((key) => {
            const render = sectionContent[key];
            return render ? <View key={key} style={{ marginTop: 16 }}>{render(true)}</View> : null;
          })}
        </View>
        <View style={styles.main}>
          {main.map((key) => {
            const render = sectionContent[key];
            return render ? <View key={key} style={{ marginTop: 16 }}>{render(false)}</View> : null;
          })}
        </View>
      </Page>
    </Document>
  );
}

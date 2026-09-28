import { Fragment } from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PdfTemplateProps } from "@/components/pdf/BasicPdfTemplate";
import { allFields, type FieldKey } from "@/lib/fields";
import { getFontScaleRatio } from "@/lib/fontSize";
import i18n from "@/lib/i18n/i18nCore";
import { HARVARD_PDF_FONT } from "@/lib/pdf/fonts";
import { renderPdfFieldItems } from "@/lib/pdf/renderFieldItems";
import {
  filledHonorAwardEntries,
  filledLeadershipEntries,
} from "@/lib/resumeContent";
import {
  harvardSectionLabels,
  languageLevelKey,
  type SectionKey,
  type WorkEntry,
} from "@/lib/resumeData";

const BLACK = "#000000";
// Keeps a section heading off the bottom of a page when its first entry wraps to the next one.
const SECTION_TITLE_PRESENCE = 48;

// Harvard is locked: fixed Times-style serif (Tinos), no color, icons or photo.
// Mirrors HarvardTemplate.tsx at 1px = 0.75pt (A4: 794px = 595pt): font sizes scale with the
// font-size setting like the preview's --resume-font-scale, spacing stays fixed like Tailwind's.
export default function HarvardPdfTemplate({
  data,
  sectionOrder,
  fontSize,
  visibleFields,
}: PdfTemplateProps) {
  const scale = getFontScaleRatio(fontSize ?? "medium");
  const s = (px: number) => Math.round(px * scale * 10) / 10;
  const isVisible = (key: FieldKey) =>
    (!visibleFields || visibleFields.includes(key)) && key !== "photo";
  const fieldOrder = (visibleFields ?? allFields).filter((key) => key !== "photo");

  const styles = StyleSheet.create({
    page: {
      fontFamily: HARVARD_PDF_FONT,
      padding: 30,
      fontSize: s(12),
      lineHeight: 1.5,
      color: BLACK,
    },
    header: { flexDirection: "column", gap: 3, textAlign: "center" },
    name: {
      fontWeight: "bold",
      fontSize: s(22.5),
      lineHeight: 1.2,
      letterSpacing: s(22.5) * 0.025,
      textTransform: "uppercase",
    },
    small: { fontSize: s(10.5), lineHeight: 1.43 },
    contactRow: {
      flexDirection: "row",
      justifyContent: "center",
      flexWrap: "wrap",
      columnGap: 6,
      rowGap: 3,
    },
    aboutMe: { textAlign: "left" },
    sectionTitle: {
      fontWeight: "bold",
      fontSize: s(10.5),
      lineHeight: 1.43,
      textTransform: "uppercase",
      letterSpacing: s(10.5) * 0.2,
      borderBottomWidth: 0.75,
      borderBottomColor: BLACK,
      paddingBottom: 3,
      marginTop: 18,
      marginBottom: 9,
    },
    entryList: { flexDirection: "column", gap: 9 },
    compactList: { flexDirection: "column", gap: 6 },
    lineList: { flexDirection: "column", gap: 3 },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: 6,
    },
    shrink: { flexShrink: 1 },
    entryTitle: { fontWeight: "bold", flexShrink: 1 },
    date: { fontSize: s(10.5), lineHeight: 1.43, flexShrink: 0 },
    description: { fontSize: s(10.5), lineHeight: 1.43, marginTop: 3 },
  });

  const workEntries = data.workExperience.filter(
    (e) => e.position || e.location || e.jobDescription || e.dateFrom || e.dateTo,
  );
  const educationEntries = data.education.filter(
    (e) => e.school || e.subject || e.location || e.description || e.dateFrom || e.dateTo,
  );
  const skillEntries = data.skills.filter((e) => e.value);
  const certificationEntries = data.certifications.filter(
    (e) => e.name || e.dateFrom || e.dateTo,
  );
  const languageEntries = data.languages.filter((e) => e.language);
  const interestEntries = data.interests.filter((e) => e.value);
  const leadershipEntries = filledLeadershipEntries(data);
  const honorAwardEntries = filledHonorAwardEntries(data);

  const dateRangeOf = (entry: { dateFrom: string; dateTo: string }) =>
    [entry.dateFrom, entry.dateTo].filter(Boolean).join(" – ");

  const sectionTitle = (label: string) => (
    <Text style={styles.sectionTitle} minPresenceAhead={SECTION_TITLE_PRESENCE}>
      {label}
    </Text>
  );

  const positionEntry = (entry: WorkEntry) => {
    const dateRange = dateRangeOf(entry);
    return (
      <View key={entry.id} wrap={false}>
        <View style={styles.row}>
          {entry.position && <Text style={styles.entryTitle}>{entry.position}</Text>}
          {dateRange && <Text style={styles.date}>{dateRange}</Text>}
        </View>
        {entry.location && <Text style={styles.small}>{entry.location}</Text>}
        {entry.jobDescription && (
          <Text style={styles.description}>{entry.jobDescription}</Text>
        )}
      </View>
    );
  };

  const sectionContent: Partial<Record<SectionKey, React.ReactNode>> = {
    workExperience: workEntries.length > 0 && (
      <>
        {sectionTitle("Work Experience")}
        <View style={styles.entryList}>{workEntries.map(positionEntry)}</View>
      </>
    ),
    education: educationEntries.length > 0 && (
      <>
        {sectionTitle("Education")}
        <View style={styles.entryList}>
          {educationEntries.map((entry) => {
            const dateRange = dateRangeOf(entry);
            return (
              <View key={entry.id} wrap={false}>
                <View style={styles.row}>
                  {entry.school && <Text style={styles.entryTitle}>{entry.school}</Text>}
                  {dateRange && <Text style={styles.date}>{dateRange}</Text>}
                </View>
                {entry.subject && <Text style={styles.small}>{entry.subject}</Text>}
                {entry.location && <Text style={styles.small}>{entry.location}</Text>}
                {entry.description && (
                  <Text style={styles.description}>{entry.description}</Text>
                )}
              </View>
            );
          })}
        </View>
      </>
    ),
    skills: skillEntries.length > 0 && (
      <>
        {sectionTitle("Skills")}
        <View style={styles.lineList}>
          {skillEntries.map((entry) => (
            <Text key={entry.id} style={styles.small}>
              {entry.value}
            </Text>
          ))}
        </View>
      </>
    ),
    certifications: certificationEntries.length > 0 && (
      <>
        {sectionTitle("Certifications")}
        <View style={styles.compactList}>
          {certificationEntries.map((entry) => {
            const dateRange = dateRangeOf(entry);
            return (
              <View key={entry.id} style={styles.row}>
                <Text style={styles.entryTitle}>{entry.name}</Text>
                {dateRange && <Text style={styles.date}>{dateRange}</Text>}
              </View>
            );
          })}
        </View>
      </>
    ),
    languages: languageEntries.length > 0 && (
      <>
        {sectionTitle("Languages")}
        <Text style={styles.small}>
          {languageEntries
            .map((e) => `${e.language} (${i18n.t(languageLevelKey(e.level))})`)
            .join(" · ")}
        </Text>
      </>
    ),
    interests: interestEntries.length > 0 && (
      <>
        {sectionTitle("Interests")}
        <Text style={styles.small}>{interestEntries.map((e) => e.value).join(" · ")}</Text>
      </>
    ),
    customFields: Boolean(data.customFieldValue) && (
      <>
        {sectionTitle(data.customFieldsTitle || "Custom Field")}
        <Text style={styles.small}>{data.customFieldValue}</Text>
      </>
    ),
  };

  const fieldContent: Partial<Record<FieldKey, React.ReactNode>> = {
    name: isVisible("name") && <Text style={styles.name}>{data.name}</Text>,
    jobTitle: data.jobTitle && isVisible("jobTitle") && (
      <Text style={styles.small}>{data.jobTitle}</Text>
    ),
    phone: data.phone && isVisible("phone") && <Text style={styles.small}>{data.phone}</Text>,
    email: data.email && isVisible("email") && <Text style={styles.small}>{data.email}</Text>,
    address: data.address && isVisible("address") && (
      <Text style={styles.small}>{data.address}</Text>
    ),
    website: data.website && isVisible("website") && (
      <Text style={styles.small}>{data.website}</Text>
    ),
    linkedin: data.linkedin && isVisible("linkedin") && (
      <Text style={styles.small}>{data.linkedin}</Text>
    ),
    aboutMe: data.aboutMe && isVisible("aboutMe") && (
      <View style={styles.aboutMe}>
        {sectionTitle("About Me")}
        <Text style={styles.small}>{data.aboutMe}</Text>
      </View>
    ),
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {renderPdfFieldItems(fieldOrder, fieldContent, {
            packContactFields: true,
            contactRowStyle: styles.contactRow,
          })}
        </View>

        {sectionOrder.map((key) => (
          <Fragment key={key}>{sectionContent[key]}</Fragment>
        ))}

        {leadershipEntries.length > 0 && (
          <>
            {sectionTitle(harvardSectionLabels.leadershipExperience)}
            <View style={styles.entryList}>{leadershipEntries.map(positionEntry)}</View>
          </>
        )}

        {honorAwardEntries.length > 0 && (
          <>
            {sectionTitle(harvardSectionLabels.honorsAwards)}
            <View style={styles.compactList}>
              {honorAwardEntries.map((entry) => {
                const dateRange = dateRangeOf(entry);
                return (
                  <View key={entry.id} style={styles.row}>
                    <View style={styles.shrink}>
                      {entry.name && <Text style={styles.entryTitle}>{entry.name}</Text>}
                      {entry.issuer && <Text style={styles.small}>{entry.issuer}</Text>}
                    </View>
                    {dateRange && <Text style={styles.date}>{dateRange}</Text>}
                  </View>
                );
              })}
            </View>
          </>
        )}
      </Page>
    </Document>
  );
}


import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PdfTemplateProps } from "@/components/pdf/BasicPdfTemplate";
import { allFields, type FieldKey } from "@/lib/fields";
import { getFontScaleRatio } from "@/lib/fontSize";
import i18n from "@/lib/i18n/i18nCore";
import { renderPdfFieldItems } from "@/lib/pdf/renderFieldItems";
import {
  filledHonorAwardEntries,
  filledLeadershipEntries,
} from "@/lib/resumeContent";
import { harvardSectionLabels, languageLevelKey, type SectionKey } from "@/lib/resumeData";

const BLACK = "#000000";

// Harvard's style is locked: "Times-Roman"/"Times-Bold" are two of
// @react-pdf's 14 standard base fonts, built into the PDF spec — unlike
// every other template's fonts (lib/pdf/fonts.ts), these need no
// Font.register() call at all. No color, no icons, no photo (see
// HarvardTemplate.tsx, the on-screen counterpart, for the same rules).
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
    page: { fontFamily: "Times-Roman", padding: 40, fontSize: s(10.5), color: BLACK },
    header: { alignItems: "center", textAlign: "center", marginBottom: 6 },
    name: {
      fontFamily: "Times-Bold",
      fontSize: s(24),
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    jobTitle: { fontSize: s(10), marginTop: 4 },
    contactRow: {
      flexDirection: "row",
      justifyContent: "center",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 6,
    },
    contactText: { fontSize: s(9.5) },
    sectionTitle: {
      fontFamily: "Times-Bold",
      fontSize: s(10),
      textTransform: "uppercase",
      letterSpacing: 2,
      borderBottomWidth: 1,
      borderBottomColor: BLACK,
      paddingBottom: 3,
      marginTop: 14,
      marginBottom: 8,
    },
    entry: { marginBottom: 8 },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
    entryTitle: { fontFamily: "Times-Bold", fontSize: s(11) },
    entryMeta: { fontSize: s(9.5) },
    entryDescription: { fontSize: s(9.5), marginTop: 3, lineHeight: 1.4 },
    bodyText: { fontSize: s(10), textAlign: "center" },
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

  const sectionContent: Partial<Record<SectionKey, React.ReactNode>> = {
    workExperience: workEntries.length > 0 && (
      <View key="workExperience">
        <Text style={styles.sectionTitle}>Work Experience</Text>
        {workEntries.map((entry) => {
          const dateRange = [entry.dateFrom, entry.dateTo].filter(Boolean).join(" – ");
          return (
            <View key={entry.id} style={styles.entry} wrap={false}>
              <View style={styles.row}>
                {entry.position && <Text style={styles.entryTitle}>{entry.position}</Text>}
                {dateRange && <Text style={styles.entryMeta}>{dateRange}</Text>}
              </View>
              {entry.location && <Text style={styles.entryMeta}>{entry.location}</Text>}
              {entry.jobDescription && (
                <Text style={styles.entryDescription}>{entry.jobDescription}</Text>
              )}
            </View>
          );
        })}
      </View>
    ),
    education: educationEntries.length > 0 && (
      <View key="education">
        <Text style={styles.sectionTitle}>Education</Text>
        {educationEntries.map((entry) => {
          const dateRange = [entry.dateFrom, entry.dateTo].filter(Boolean).join(" – ");
          return (
            <View key={entry.id} style={styles.entry} wrap={false}>
              <View style={styles.row}>
                {entry.school && <Text style={styles.entryTitle}>{entry.school}</Text>}
                {dateRange && <Text style={styles.entryMeta}>{dateRange}</Text>}
              </View>
              {entry.subject && <Text style={styles.entryMeta}>{entry.subject}</Text>}
              {entry.location && <Text style={styles.entryMeta}>{entry.location}</Text>}
              {entry.description && (
                <Text style={styles.entryDescription}>{entry.description}</Text>
              )}
            </View>
          );
        })}
      </View>
    ),
    skills: skillEntries.length > 0 && (
      <View key="skills">
        <Text style={styles.sectionTitle}>Skills</Text>
        <Text style={styles.bodyText}>{skillEntries.map((e) => e.value).join(" · ")}</Text>
      </View>
    ),
    certifications: certificationEntries.length > 0 && (
      <View key="certifications">
        <Text style={styles.sectionTitle}>Certifications</Text>
        {certificationEntries.map((entry) => {
          const dateRange = [entry.dateFrom, entry.dateTo].filter(Boolean).join(" – ");
          return (
            <View key={entry.id} style={styles.row}>
              <Text style={styles.entryTitle}>{entry.name}</Text>
              {dateRange && <Text style={styles.entryMeta}>{dateRange}</Text>}
            </View>
          );
        })}
      </View>
    ),
    languages: languageEntries.length > 0 && (
      <View key="languages">
        <Text style={styles.sectionTitle}>Languages</Text>
        <Text style={styles.bodyText}>
          {languageEntries
            .map((e) => `${e.language} (${i18n.t(languageLevelKey(e.level))})`)
            .join(" · ")}
        </Text>
      </View>
    ),
    interests: interestEntries.length > 0 && (
      <View key="interests">
        <Text style={styles.sectionTitle}>Interests</Text>
        <Text style={styles.bodyText}>{interestEntries.map((e) => e.value).join(" · ")}</Text>
      </View>
    ),
    customFields: Boolean(data.customFieldValue) && (
      <View key="customFields">
        <Text style={styles.sectionTitle}>{data.customFieldsTitle || "Custom Field"}</Text>
        <Text style={styles.bodyText}>{data.customFieldValue}</Text>
      </View>
    ),
  };

  const fieldContent: Partial<Record<FieldKey, React.ReactNode>> = {
    name: isVisible("name") && <Text style={styles.name}>{data.name}</Text>,
    jobTitle: data.jobTitle && isVisible("jobTitle") && (
      <Text style={styles.jobTitle}>{data.jobTitle}</Text>
    ),
    phone: data.phone && isVisible("phone") && (
      <Text style={styles.contactText}>{data.phone}</Text>
    ),
    email: data.email && isVisible("email") && (
      <Text style={styles.contactText}>{data.email}</Text>
    ),
    address: data.address && isVisible("address") && (
      <Text style={styles.contactText}>{data.address}</Text>
    ),
    website: data.website && isVisible("website") && (
      <Text style={styles.contactText}>{data.website}</Text>
    ),
    linkedin: data.linkedin && isVisible("linkedin") && (
      <Text style={styles.contactText}>{data.linkedin}</Text>
    ),
    aboutMe: data.aboutMe && isVisible("aboutMe") && (
      <View>
        <Text style={styles.sectionTitle}>About Me</Text>
        <Text style={styles.bodyText}>{data.aboutMe}</Text>
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
          <View key={key}>{sectionContent[key]}</View>
        ))}

        {leadershipEntries.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>{harvardSectionLabels.leadershipExperience}</Text>
            {leadershipEntries.map((entry) => {
              const dateRange = [entry.dateFrom, entry.dateTo].filter(Boolean).join(" – ");
              return (
                <View key={entry.id} style={styles.entry} wrap={false}>
                  <View style={styles.row}>
                    {entry.position && <Text style={styles.entryTitle}>{entry.position}</Text>}
                    {dateRange && <Text style={styles.entryMeta}>{dateRange}</Text>}
                  </View>
                  {entry.location && <Text style={styles.entryMeta}>{entry.location}</Text>}
                  {entry.jobDescription && (
                    <Text style={styles.entryDescription}>{entry.jobDescription}</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {honorAwardEntries.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>{harvardSectionLabels.honorsAwards}</Text>
            {honorAwardEntries.map((entry) => {
              const dateRange = [entry.dateFrom, entry.dateTo].filter(Boolean).join(" – ");
              return (
                <View key={entry.id} style={[styles.row, { marginBottom: 4 }]}>
                  <View>
                    {entry.name && <Text style={styles.entryTitle}>{entry.name}</Text>}
                    {entry.issuer && <Text style={styles.entryMeta}>{entry.issuer}</Text>}
                  </View>
                  {dateRange && <Text style={styles.entryMeta}>{dateRange}</Text>}
                </View>
              );
            })}
          </View>
        )}
      </Page>
    </Document>
  );
}

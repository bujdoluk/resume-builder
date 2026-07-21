
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PdfTemplateProps } from "@/components/pdf/BasicPdfTemplate";
import {
  AddressPdfIcon,
  EmailPdfIcon,
  LinkedInPdfIcon,
  PhonePdfIcon,
  WebsitePdfIcon,
} from "@/components/pdf/PdfIcons";
import { allFields, type FieldKey } from "@/lib/fields";
import { getFontScaleRatio } from "@/lib/fontSize";
import {
  DAISYUI_PRIMARY,
  DAISYUI_PRIMARY_40,
  GRAY_500,
  GRAY_600,
  GRAY_700,
  RESUME_TEXT_COLOR,
} from "@/lib/pdf/theme";
import { renderPdfFieldItems } from "@/lib/pdf/renderFieldItems";
import type { SectionKey } from "@/lib/resumeData";

export default function MinimalPdfTemplate({
  data,
  sectionOrder,
  color,
  font,
  fontSize,
  visibleFields,
}: PdfTemplateProps) {
  const scale = getFontScaleRatio(fontSize ?? "medium");
  const s = (px: number) => Math.round(px * scale * 10) / 10;
  const isVisible = (key: FieldKey) => !visibleFields || visibleFields.includes(key);
  const fontFamily = font ?? "inter";

  const styles = StyleSheet.create({
    page: { fontFamily, padding: 40, fontSize: s(10), color: RESUME_TEXT_COLOR },
    header: { alignItems: "center", textAlign: "center", marginBottom: 6 },
    photo: { width: 64, height: 64, borderRadius: 32, objectFit: "cover", marginBottom: 8 },
    name: { fontSize: s(26), fontWeight: "bold", letterSpacing: 1 },

    jobTitle: {
      fontSize: s(9),
      fontWeight: "bold",
      color: DAISYUI_PRIMARY,
      textTransform: "uppercase",
      letterSpacing: 1.5,
      marginTop: 4,
    },
    contactRow: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap", gap: 10, marginTop: 6 },
    contactItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    contactText: { fontSize: s(9), color: GRAY_500 },
    photoRow: { flexDirection: "row", alignItems: "stretch", gap: 14, textAlign: "left" },
    photoTextCol: { flex: 1, flexDirection: "column", justifyContent: "center", gap: 2 },
    sectionTitle: {
      fontSize: s(9),
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: 2,
      borderBottomWidth: 1.5,
      borderBottomColor: color ?? DAISYUI_PRIMARY,
      paddingBottom: 3,
      marginTop: 14,
      marginBottom: 8,
    },

    entry: { borderLeftWidth: 1.5, borderLeftColor: DAISYUI_PRIMARY_40, paddingLeft: 8, marginBottom: 8 },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
    entryTitle: { fontSize: s(12), fontWeight: "bold" },
    entryMeta: { fontSize: s(9.5), color: GRAY_500 },
    entryMetaAlt: { fontSize: s(9.5), color: GRAY_600, marginTop: 1 },
    entryDescription: { fontSize: s(9.5), color: GRAY_700, marginTop: 3, lineHeight: 1.4 },
    bodyText: { fontSize: s(10), color: GRAY_700, textAlign: "center" },
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
              {entry.jobDescription && <Text style={styles.entryDescription}>{entry.jobDescription}</Text>}
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
              {entry.school && <Text style={styles.entryTitle}>{entry.school}</Text>}
              <View style={styles.row}>
                {entry.subject && <Text style={styles.entryMetaAlt}>{entry.subject}</Text>}
                {dateRange && <Text style={styles.entryMeta}>{dateRange}</Text>}
              </View>
              {entry.location && <Text style={styles.entryMeta}>{entry.location}</Text>}
              {entry.description && <Text style={styles.entryDescription}>{entry.description}</Text>}
            </View>
          );
        })}
      </View>
    ),
    skills: skillEntries.length > 0 && (
      <View key="skills">
        <Text style={styles.sectionTitle}>Skills</Text>
        {skillEntries.map((entry) => (
          <Text key={entry.id} style={[styles.bodyText, { marginBottom: 2 }]}>
            {entry.value}
          </Text>
        ))}
      </View>
    ),
    certifications: certificationEntries.length > 0 && (
      <View key="certifications">
        <Text style={styles.sectionTitle}>Certifications</Text>
        {certificationEntries.map((entry) => {
          const dateRange = [entry.dateFrom, entry.dateTo].filter(Boolean).join(" – ");
          return (
            <View key={entry.id} style={{ marginBottom: 4 }}>
              {dateRange && (
                <Text style={[styles.bodyText, { fontSize: s(9), color: GRAY_500 }]}>
                  {dateRange}
                </Text>
              )}
              <Text style={[styles.bodyText, { fontWeight: "bold" }]}>{entry.name}</Text>
            </View>
          );
        })}
      </View>
    ),
    languages: languageEntries.length > 0 && (
      <View key="languages">
        <Text style={styles.sectionTitle}>Languages</Text>
        <Text style={styles.bodyText}>
          {languageEntries.map((e) => `${e.language} (${e.level})`).join(" · ")}
        </Text>
      </View>
    ),
    interests: interestEntries.length > 0 && (
      <View key="interests">
        <Text style={styles.sectionTitle}>Interests</Text>
        <Text style={styles.bodyText}>{interestEntries.map((e) => e.value).join(" · ")}</Text>
      </View>
    ),
  };

  const fieldOrder = visibleFields ?? allFields;

  const fieldContent: Partial<Record<FieldKey, React.ReactNode>> = {
    photo: data.photo && isVisible("photo") && (
      // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image, not an HTML img element
      <Image src={data.photo} style={styles.photo} />
    ),
    name: isVisible("name") && (
      <Text style={styles.name}>{data.name || "Your Name"}</Text>
    ),
    jobTitle: data.jobTitle && isVisible("jobTitle") && (
      <Text style={styles.jobTitle}>{data.jobTitle}</Text>
    ),
    phone: data.phone && isVisible("phone") && (
      <View style={styles.contactItem}>
        <PhonePdfIcon size={s(8)} color={GRAY_500} />
        <Text style={styles.contactText}>{data.phone}</Text>
      </View>
    ),
    email: data.email && isVisible("email") && (
      <View style={styles.contactItem}>
        <EmailPdfIcon size={s(8)} color={GRAY_500} />
        <Text style={styles.contactText}>{data.email}</Text>
      </View>
    ),
    address: data.address && isVisible("address") && (
      <View style={styles.contactItem}>
        <AddressPdfIcon size={s(8)} color={GRAY_500} />
        <Text style={styles.contactText}>{data.address}</Text>
      </View>
    ),
    website: data.website && isVisible("website") && (
      <View style={styles.contactItem}>
        <WebsitePdfIcon size={s(8)} color={GRAY_500} />
        <Text style={styles.contactText}>{data.website}</Text>
      </View>
    ),
    linkedin: data.linkedin && isVisible("linkedin") && (
      <View style={styles.contactItem}>
        <LinkedInPdfIcon size={s(8)} color={GRAY_500} />
        <Text style={styles.contactText}>{data.linkedin}</Text>
      </View>
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
            photoRowStyle: styles.photoRow,
            photoTextColStyle: styles.photoTextCol,
            packContactFields: true,
            contactRowStyle: styles.contactRow,
          })}
        </View>

        {sectionOrder.map((key) => (
          <View key={key}>{sectionContent[key]}</View>
        ))}
      </Page>
    </Document>
  );
}

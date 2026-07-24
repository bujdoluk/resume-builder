
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  AboutMePdfIcon,
  AddressPdfIcon,
  CertificationsPdfIcon,
  EducationPdfIcon,
  EmailPdfIcon,
  InterestsPdfIcon,
  LanguagesPdfIcon,
  LinkedInPdfIcon,
  PhonePdfIcon,
  SkillsPdfIcon,
  StarRatingPdfIcon,
  WebsitePdfIcon,
  WorkHistoryPdfIcon,
} from "@/components/pdf/PdfIcons";
import { getContrastTextColor } from "@/lib/color";
import { allFields, type FieldKey } from "@/lib/fields";
import { getFontScaleRatio } from "@/lib/fontSize";
import {
  DAISYUI_BASE_300,
  DAISYUI_NEUTRAL,
  DAISYUI_NEUTRAL_CONTENT,
  DAISYUI_PRIMARY,
  GRAY_500,
  GRAY_600,
  GRAY_700,
  RESUME_TEXT_COLOR,
} from "@/lib/pdf/theme";
import { renderPdfFieldItems } from "@/lib/pdf/renderFieldItems";
import {
  languageLevels,
  type SectionKey,
} from "@/lib/resumeData";
import type { PdfTemplateProps } from "@/components/pdf/BasicPdfTemplate";

const TIMELINE_DOT_COL_WIDTH = 16;

export default function ClassicPdfTemplate({
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
  const accentColor = color ?? undefined;
  const headerBg = color ?? DAISYUI_NEUTRAL;
  const headerFg = color ? getContrastTextColor(color) : DAISYUI_NEUTRAL_CONTENT;
  const fontFamily = font ?? "inter";

  const styles = StyleSheet.create({
    page: {
      fontFamily,
      fontSize: s(10),
      color: RESUME_TEXT_COLOR,
    },
    header: {
      backgroundColor: headerBg,
      color: headerFg,
      padding: 32,
    },
    body: { padding: 32 },
    name: { fontSize: s(26), fontWeight: "bold" },
    jobTitle: { fontSize: s(13), opacity: 0.8, marginTop: 2 },
    contactRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      fontSize: s(9),
      opacity: 0.8,
      marginTop: 3,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 14,
      marginBottom: 6,
    },
    sectionHeaderText: {
      fontSize: s(9),
      fontWeight: "bold",
      color: accentColor ?? GRAY_500,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    entryTitle: { fontSize: s(12), fontWeight: "bold" },
    entryMeta: { fontSize: s(9.5), color: GRAY_500, marginTop: 1 },
    entryMetaAlt: { fontSize: s(9.5), color: GRAY_600, marginTop: 1 },
    entryDescription: { fontSize: s(9.5), color: GRAY_700, marginTop: 3, lineHeight: 1.4 },
    bodyText: { fontSize: s(10), color: GRAY_700 },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
    photo: { width: 60, height: 60, borderRadius: 30, objectFit: "cover" },
    fieldsCol: { flexDirection: "column", gap: 4 },
    photoRow: { flexDirection: "row", alignItems: "stretch", gap: 14 },
    photoTextCol: { flex: 1, flexDirection: "column", justifyContent: "center", gap: 2 },

    timelineWrap: { position: "relative" },
    timelineLine: {
      position: "absolute",
      top: 4,
      bottom: 4,
      left: TIMELINE_DOT_COL_WIDTH / 2 - 1.25,
      width: 2.5,
      backgroundColor: DAISYUI_BASE_300,
    },
    timelineRow: { flexDirection: "row", marginBottom: 12 },
    timelineDotCol: { width: TIMELINE_DOT_COL_WIDTH, alignItems: "center" },
    timelineDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      marginTop: 6,
      backgroundColor: accentColor ?? DAISYUI_PRIMARY,
    },
    timelineContent: { flex: 1 },
    timelineDate: { fontSize: s(9), color: GRAY_500, marginBottom: 4 },
    timelineBox: {
      borderWidth: 1,
      borderColor: DAISYUI_BASE_300,
      borderRadius: 8,
      backgroundColor: "#ffffff",
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
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

  function sectionHeader(icon: React.ReactNode, title: string) {
    return (
      <View style={styles.sectionHeader}>
        {icon}
        <Text style={styles.sectionHeaderText}>{title}</Text>
      </View>
    );
  }

  function timelineEntries(entries: { id: string; dateRange: string; content: React.ReactNode }[]) {
    return (
      <View style={styles.timelineWrap}>
        <View style={styles.timelineLine} />
        {entries.map((entry) => (
          <View key={entry.id} style={styles.timelineRow} wrap={false}>
            <View style={styles.timelineDotCol}>
              <View style={styles.timelineDot} />
            </View>
            <View style={styles.timelineContent}>
              {entry.dateRange && <Text style={styles.timelineDate}>{entry.dateRange}</Text>}
              <View style={styles.timelineBox}>{entry.content}</View>
            </View>
          </View>
        ))}
      </View>
    );
  }

  const sectionContent: Partial<Record<SectionKey, React.ReactNode>> = {
    workExperience: workEntries.length > 0 && (
      <View key="workExperience">
        {sectionHeader(
          <WorkHistoryPdfIcon size={s(11)} color={accentColor ?? GRAY_500} />,
          "Work Experience",
        )}
        {timelineEntries(
          workEntries.map((entry) => ({
            id: entry.id,
            dateRange: [entry.dateFrom, entry.dateTo].filter(Boolean).join(" – "),
            content: (
              <>
                {entry.position && <Text style={styles.entryTitle}>{entry.position}</Text>}
                {entry.location && <Text style={styles.entryMeta}>{entry.location}</Text>}
                {entry.jobDescription && (
                  <Text style={styles.entryDescription}>{entry.jobDescription}</Text>
                )}
              </>
            ),
          })),
        )}
      </View>
    ),

    education: educationEntries.length > 0 && (
      <View key="education">
        {sectionHeader(
          <EducationPdfIcon size={s(11)} color={accentColor ?? GRAY_500} />,
          "Education",
        )}
        {timelineEntries(
          educationEntries.map((entry) => ({
            id: entry.id,
            dateRange: [entry.dateFrom, entry.dateTo].filter(Boolean).join(" – "),
            content: (
              <>
                {entry.subject && <Text style={styles.entryTitle}>{entry.subject}</Text>}
                {entry.school && <Text style={styles.entryMetaAlt}>{entry.school}</Text>}
                {entry.location && <Text style={styles.entryMeta}>{entry.location}</Text>}
                {entry.description && (
                  <Text style={styles.entryDescription}>{entry.description}</Text>
                )}
              </>
            ),
          })),
        )}
      </View>
    ),

    skills: skillEntries.length > 0 && (
      <View key="skills">
        {sectionHeader(
          <SkillsPdfIcon size={s(11)} color={accentColor ?? GRAY_500} />,
          "Skills",
        )}
        {skillEntries.map((entry) => (
          <Text key={entry.id} style={[styles.bodyText, { marginBottom: 2 }]}>
            {entry.value}
          </Text>
        ))}
      </View>
    ),

    certifications: certificationEntries.length > 0 && (
      <View key="certifications">
        {sectionHeader(
          <CertificationsPdfIcon size={s(11)} color={accentColor ?? GRAY_500} />,
          "Certifications",
        )}
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
        {sectionHeader(
          <LanguagesPdfIcon size={s(11)} color={accentColor ?? GRAY_500} />,
          "Languages",
        )}
        {languageEntries.map((entry) => (
          <View
            key={entry.id}
            style={[styles.row, { marginBottom: 4, alignItems: "center" }]}
          >
            <Text style={[styles.bodyText, { fontWeight: "bold" }]}>{entry.language}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Text style={{ fontSize: s(10), color: GRAY_500 }}>{entry.level}</Text>
              <StarRatingPdfIcon
                filled={languageLevels.indexOf(entry.level) + 1}
                total={languageLevels.length}
                size={s(10)}
                color={accentColor ?? RESUME_TEXT_COLOR}
              />
            </View>
          </View>
        ))}
      </View>
    ),

    interests: interestEntries.length > 0 && (
      <View key="interests">
        {sectionHeader(
          <InterestsPdfIcon size={s(11)} color={accentColor ?? GRAY_500} />,
          "Interests",
        )}
        <Text style={styles.bodyText}>{interestEntries.map((e) => e.value).join(", ")}</Text>
      </View>
    ),
  };

  const fieldOrder = visibleFields ?? allFields;
  const headerFieldOrder = fieldOrder.filter((key) => key !== "aboutMe");

  const fieldContent: Partial<Record<FieldKey, React.ReactNode>> = {
    photo: data.photo && isVisible("photo") && (
      // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image, not an HTML img element
      <Image src={data.photo} style={styles.photo} />
    ),
    name: isVisible("name") && (
      <Text style={styles.name}>{data.name}</Text>
    ),
    jobTitle: data.jobTitle && isVisible("jobTitle") && (
      <Text style={styles.jobTitle}>{data.jobTitle}</Text>
    ),
    phone: data.phone && isVisible("phone") && (
      <View style={styles.contactRow}>
        <PhonePdfIcon size={s(8)} color={headerFg} />
        <Text>{data.phone}</Text>
      </View>
    ),
    email: data.email && isVisible("email") && (
      <View style={styles.contactRow}>
        <EmailPdfIcon size={s(8)} color={headerFg} />
        <Text>{data.email}</Text>
      </View>
    ),
    address: data.address && isVisible("address") && (
      <View style={styles.contactRow}>
        <AddressPdfIcon size={s(8)} color={headerFg} />
        <Text>{data.address}</Text>
      </View>
    ),
    website: data.website && isVisible("website") && (
      <View style={styles.contactRow}>
        <WebsitePdfIcon size={s(8)} color={headerFg} />
        <Text>{data.website}</Text>
      </View>
    ),
    linkedin: data.linkedin && isVisible("linkedin") && (
      <View style={styles.contactRow}>
        <LinkedInPdfIcon size={s(8)} color={headerFg} />
        <Text>{data.linkedin}</Text>
      </View>
    ),
    aboutMe: data.aboutMe && isVisible("aboutMe") && (
      <View>
        {sectionHeader(
          <AboutMePdfIcon size={s(11)} color={accentColor ?? GRAY_500} />,
          "About Me",
        )}
        <Text style={styles.bodyText}>{data.aboutMe}</Text>
      </View>
    ),
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.fieldsCol}>
            {renderPdfFieldItems(headerFieldOrder, fieldContent, {
              photoRowStyle: styles.photoRow,
              photoTextColStyle: styles.photoTextCol,
            })}
          </View>
        </View>

        <View style={styles.body}>
          {fieldContent.aboutMe}

          {sectionOrder.map((key) => (
            <View key={key}>{sectionContent[key]}</View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

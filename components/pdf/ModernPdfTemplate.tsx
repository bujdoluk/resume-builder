
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  AboutMePdfIcon,
  AddressPdfIcon,
  CertificationsPdfIcon,
  CustomFieldsPdfIcon,
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
  DAISYUI_NEUTRAL,
  DAISYUI_NEUTRAL_CONTENT,
  GRAY_500,
  GRAY_600,
  GRAY_700,
  RESUME_TEXT_COLOR,
} from "@/lib/pdf/theme";
import {
  languageLevels,
  resolveModernSectionZone,
  splitSectionsByZone,
  type SectionKey,
} from "@/lib/resumeData";
import type { PdfTemplateProps } from "@/components/pdf/BasicPdfTemplate";

export default function ModernPdfTemplate({
  data,
  sectionOrder,
  color,
  font,
  fontSize,
  visibleFields,
  modernSectionZones,
}: PdfTemplateProps) {
  const scale = getFontScaleRatio(fontSize ?? "medium");
  const s = (px: number) => Math.round(px * scale * 10) / 10;
  const isVisible = (key: FieldKey) => !visibleFields || visibleFields.includes(key);
  const accentColor = color ?? undefined;
  const sidebarBg = color ?? DAISYUI_NEUTRAL;
  const sidebarFg = color ? getContrastTextColor(color) : DAISYUI_NEUTRAL_CONTENT;
  const fontFamily = font ?? "inter";

  const styles = StyleSheet.create({
    page: { fontFamily, fontSize: s(10), color: RESUME_TEXT_COLOR, flexDirection: "row" },
    sidebar: {
      width: 180,
      backgroundColor: sidebarBg,
      color: sidebarFg,
      padding: 20,
    },
    main: { flex: 1, padding: 24 },
    photo: {
      width: 70,
      height: 70,
      borderRadius: 35,
      objectFit: "cover",
      alignSelf: "center",
      marginBottom: 10,
    },
    sidebarName: { fontSize: s(18), fontWeight: "bold", textAlign: "center" },
    sidebarJobTitle: { fontSize: s(9), opacity: 0.8, textAlign: "center", marginTop: 2, marginBottom: 10 },
    sidebarContactRow: { flexDirection: "row", alignItems: "center", gap: 5, fontSize: s(8), opacity: 0.8, marginTop: 4 },
    sidebarSectionHeader: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 12, marginBottom: 5, opacity: 0.7 },
    sidebarSectionHeaderText: { fontSize: s(8.5), fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1 },
    sidebarBodyText: { fontSize: s(9), marginTop: 2 },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, marginBottom: 6 },
    sectionHeaderText: {
      fontSize: s(9),
      fontWeight: "bold",
      color: accentColor ?? GRAY_500,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    entry: { marginBottom: 8 },
    entryTitle: { fontSize: s(12), fontWeight: "bold" },
    entryMeta: { fontSize: s(9.5), color: GRAY_500, marginTop: 1 },
    entryMetaAlt: { fontSize: s(9.5), color: GRAY_600, marginTop: 1 },
    entryDescription: { fontSize: s(9.5), color: GRAY_700, marginTop: 3, lineHeight: 1.4 },
    bodyText: { fontSize: s(10), color: GRAY_700 },
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

  const { sidebar: sidebarKeys, main: mainKeys } = splitSectionsByZone(
    sectionOrder,
    modernSectionZones ?? {},
  );

  const fieldOrder = visibleFields ?? allFields;
  const sidebarFieldKeys = fieldOrder.filter((key) => key !== "aboutMe");
  const aboutMeZone = resolveModernSectionZone("aboutMe", modernSectionZones ?? {});

  function mainSectionHeader(icon: React.ReactNode, title: string) {
    return (
      <View style={styles.sectionHeader}>
        {icon}
        <Text style={styles.sectionHeaderText}>{title}</Text>
      </View>
    );
  }

  function sidebarSectionHeader(icon: React.ReactNode, title: string) {
    return (
      <View style={styles.sidebarSectionHeader}>
        {icon}
        <Text style={styles.sidebarSectionHeaderText}>{title}</Text>
      </View>
    );
  }

  function renderSection(
    key: SectionKey,
    zone: "main" | "sidebar",
  ): React.ReactNode {
    switch (key) {
      case "workExperience": {
        if (workEntries.length === 0) return null;
        if (zone === "sidebar") {
          return (
            <View key="workExperience">
              {sidebarSectionHeader(<WorkHistoryPdfIcon size={s(10)} color={sidebarFg} />, "Work Experience")}
              {workEntries.map((entry) => {
                const dateRange = [entry.dateFrom, entry.dateTo].filter(Boolean).join(" – ");
                return (
                  <View key={entry.id} style={{ marginTop: 3 }} wrap={false}>
                    <Text style={styles.sidebarBodyText}>{entry.position}</Text>
                    {(dateRange || entry.location) && (
                      <Text style={[styles.sidebarBodyText, { fontSize: s(7.5), opacity: 0.7 }]}>
                        {[dateRange, entry.location].filter(Boolean).join(" · ")}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          );
        }
        return (
          <View key="workExperience">
            {mainSectionHeader(<WorkHistoryPdfIcon size={s(11)} color={accentColor ?? GRAY_500} />, "Work Experience")}
            {workEntries.map((entry) => {
              const dateRange = [entry.dateFrom, entry.dateTo].filter(Boolean).join(" – ");
              return (
                <View key={entry.id} style={styles.entry} wrap={false}>
                  {entry.position && <Text style={styles.entryTitle}>{entry.position}</Text>}
                  {(dateRange || entry.location) && (
                    <Text style={styles.entryMeta}>
                      {[dateRange, entry.location].filter(Boolean).join(" · ")}
                    </Text>
                  )}
                  {entry.jobDescription && <Text style={styles.entryDescription}>{entry.jobDescription}</Text>}
                </View>
              );
            })}
          </View>
        );
      }

      case "education": {
        if (educationEntries.length === 0) return null;
        if (zone === "sidebar") {
          return (
            <View key="education">
              {sidebarSectionHeader(<EducationPdfIcon size={s(10)} color={sidebarFg} />, "Education")}
              {educationEntries.map((entry) => {
                const dateRange = [entry.dateFrom, entry.dateTo].filter(Boolean).join(" – ");
                return (
                  <View key={entry.id} style={{ marginTop: 3 }} wrap={false}>
                    <Text style={styles.sidebarBodyText}>{entry.subject}</Text>
                    {(entry.school || dateRange || entry.location) && (
                      <Text style={[styles.sidebarBodyText, { fontSize: s(7.5), opacity: 0.7 }]}>
                        {[entry.school, dateRange, entry.location].filter(Boolean).join(" · ")}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          );
        }
        return (
          <View key="education">
            {mainSectionHeader(<EducationPdfIcon size={s(11)} color={accentColor ?? GRAY_500} />, "Education")}
            {educationEntries.map((entry) => {
              const dateRange = [entry.dateFrom, entry.dateTo].filter(Boolean).join(" – ");
              return (
                <View key={entry.id} style={styles.entry} wrap={false}>
                  {entry.subject && <Text style={styles.entryTitle}>{entry.subject}</Text>}
                  {entry.school && <Text style={styles.entryMetaAlt}>{entry.school}</Text>}
                  {(dateRange || entry.location) && (
                    <Text style={styles.entryMeta}>
                      {[dateRange, entry.location].filter(Boolean).join(" · ")}
                    </Text>
                  )}
                  {entry.description && <Text style={styles.entryDescription}>{entry.description}</Text>}
                </View>
              );
            })}
          </View>
        );
      }

      case "interests": {
        if (interestEntries.length === 0) return null;
        if (zone === "sidebar") {
          return (
            <View key="interests">
              {sidebarSectionHeader(<InterestsPdfIcon size={s(10)} color={sidebarFg} />, "Interests")}
              <Text style={styles.sidebarBodyText}>{interestEntries.map((e) => e.value).join(", ")}</Text>
            </View>
          );
        }
        return (
          <View key="interests">
            {mainSectionHeader(<InterestsPdfIcon size={s(11)} color={accentColor ?? GRAY_500} />, "Interests")}
            <Text style={styles.bodyText}>{interestEntries.map((e) => e.value).join(", ")}</Text>
          </View>
        );
      }

      case "customFields": {
        if (!data.customFieldValue) return null;
        if (zone === "sidebar") {
          return (
            <View key="customFields">
              {sidebarSectionHeader(
                <CustomFieldsPdfIcon size={s(10)} color={sidebarFg} />,
                data.customFieldsTitle || "Custom Field",
              )}
              <Text style={styles.sidebarBodyText}>{data.customFieldValue}</Text>
            </View>
          );
        }
        return (
          <View key="customFields">
            {mainSectionHeader(
              <CustomFieldsPdfIcon size={s(11)} color={accentColor ?? GRAY_500} />,
              data.customFieldsTitle || "Custom Field",
            )}
            <Text style={styles.bodyText}>{data.customFieldValue}</Text>
          </View>
        );
      }

      case "skills": {
        if (skillEntries.length === 0) return null;
        if (zone === "main") {
          return (
            <View key="skills">
              {mainSectionHeader(<SkillsPdfIcon size={s(11)} color={accentColor ?? GRAY_500} />, "Skills")}
              {skillEntries.map((entry) => (
                <Text key={entry.id} style={[styles.bodyText, { marginBottom: 2 }]}>
                  {entry.value}
                </Text>
              ))}
            </View>
          );
        }
        return (
          <View key="skills">
            {sidebarSectionHeader(<SkillsPdfIcon size={s(10)} color={sidebarFg} />, "Skills")}
            {skillEntries.map((entry) => (
              <Text key={entry.id} style={styles.sidebarBodyText}>
                {entry.value}
              </Text>
            ))}
          </View>
        );
      }

      case "certifications": {
        if (certificationEntries.length === 0) return null;
        if (zone === "main") {
          return (
            <View key="certifications">
              {mainSectionHeader(<CertificationsPdfIcon size={s(11)} color={accentColor ?? GRAY_500} />, "Certifications")}
              {certificationEntries.map((entry) => {
                const dateRange = [entry.dateFrom, entry.dateTo].filter(Boolean).join(" – ");
                return (
                  <View key={entry.id} style={styles.entry} wrap={false}>
                    {dateRange && <Text style={styles.entryMeta}>{dateRange}</Text>}
                    <Text style={styles.entryTitle}>{entry.name}</Text>
                  </View>
                );
              })}
            </View>
          );
        }
        return (
          <View key="certifications">
            {sidebarSectionHeader(<CertificationsPdfIcon size={s(10)} color={sidebarFg} />, "Certifications")}
            {certificationEntries.map((entry) => {
              const dateRange = [entry.dateFrom, entry.dateTo].filter(Boolean).join(" – ");
              return (
                <View key={entry.id} style={{ marginTop: 3 }}>
                  {dateRange && (
                    <Text style={[styles.sidebarBodyText, { fontSize: s(7.5), opacity: 0.7 }]}>
                      {dateRange}
                    </Text>
                  )}
                  <Text style={styles.sidebarBodyText}>{entry.name}</Text>
                </View>
              );
            })}
          </View>
        );
      }

      case "languages": {
        if (languageEntries.length === 0) return null;
        if (zone === "main") {
          return (
            <View key="languages">
              {mainSectionHeader(<LanguagesPdfIcon size={s(11)} color={accentColor ?? GRAY_500} />, "Languages")}
              {languageEntries.map((entry) => (
                <View key={entry.id} style={{ marginBottom: 4 }}>
                  <Text style={styles.entryTitle}>{entry.language}</Text>
                  <View style={{ marginTop: 2 }}>
                    <StarRatingPdfIcon
                      filled={languageLevels.indexOf(entry.level) + 1}
                      total={languageLevels.length}
                      size={s(8)}
                      color={accentColor ?? GRAY_500}
                    />
                  </View>
                </View>
              ))}
            </View>
          );
        }
        return (
          <View key="languages">
            {sidebarSectionHeader(<LanguagesPdfIcon size={s(10)} color={sidebarFg} />, "Languages")}
            {languageEntries.map((entry) => (
              <View key={entry.id} style={{ marginTop: 3 }}>
                <Text style={styles.sidebarBodyText}>{entry.language}</Text>
                <View style={{ marginTop: 2 }}>
                  <StarRatingPdfIcon
                    filled={languageLevels.indexOf(entry.level) + 1}
                    total={languageLevels.length}
                    size={s(7)}
                    color="#ffffff"
                  />
                </View>
              </View>
            ))}
          </View>
        );
      }
    }
  }

  const fieldContent: Partial<Record<FieldKey, React.ReactNode>> = {
    photo: data.photo && isVisible("photo") && (
      // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image, not an HTML img element
      <Image src={data.photo} style={styles.photo} />
    ),
    name: isVisible("name") && (
      <Text style={styles.sidebarName}>{data.name}</Text>
    ),
    jobTitle: data.jobTitle && isVisible("jobTitle") && (
      <Text style={styles.sidebarJobTitle}>{data.jobTitle}</Text>
    ),
    phone: data.phone && isVisible("phone") && (
      <View style={styles.sidebarContactRow}>
        <PhonePdfIcon size={s(8)} color={sidebarFg} />
        <Text>{data.phone}</Text>
      </View>
    ),
    email: data.email && isVisible("email") && (
      <View style={styles.sidebarContactRow}>
        <EmailPdfIcon size={s(8)} color={sidebarFg} />
        <Text>{data.email}</Text>
      </View>
    ),
    address: data.address && isVisible("address") && (
      <View style={styles.sidebarContactRow}>
        <AddressPdfIcon size={s(8)} color={sidebarFg} />
        <Text>{data.address}</Text>
      </View>
    ),
    website: data.website && isVisible("website") && (
      <View style={styles.sidebarContactRow}>
        <WebsitePdfIcon size={s(8)} color={sidebarFg} />
        <Text>{data.website}</Text>
      </View>
    ),
    linkedin: data.linkedin && isVisible("linkedin") && (
      <View style={styles.sidebarContactRow}>
        <LinkedInPdfIcon size={s(8)} color={sidebarFg} />
        <Text>{data.linkedin}</Text>
      </View>
    ),
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.sidebar}>
          {sidebarFieldKeys.map((key) => (
            <View key={key}>{fieldContent[key]}</View>
          ))}

          {aboutMeZone === "sidebar" && data.aboutMe && isVisible("aboutMe") && (
            <View>
              {sidebarSectionHeader(<AboutMePdfIcon size={s(10)} color={sidebarFg} />, "About Me")}
              <Text style={styles.sidebarBodyText}>{data.aboutMe}</Text>
            </View>
          )}

          {sidebarKeys.map((key) => (
            <View key={key}>{renderSection(key, "sidebar")}</View>
          ))}
        </View>

        <View style={styles.main}>
          {aboutMeZone === "main" && data.aboutMe && isVisible("aboutMe") && (
            <View>
              {mainSectionHeader(<AboutMePdfIcon size={s(11)} color={accentColor ?? GRAY_500} />, "About Me")}
              <Text style={styles.bodyText}>{data.aboutMe}</Text>
            </View>
          )}
          {mainKeys.map((key) => (
            <View key={key}>{renderSection(key, "main")}</View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

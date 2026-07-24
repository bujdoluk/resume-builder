
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  AboutMePdfIcon,
  AddressPdfIcon,
  CertificationsPdfIcon,
  CustomFieldsPdfIcon,
  DonutPdfIcon,
  EducationPdfIcon,
  EmailPdfIcon,
  InterestsPdfIcon,
  LanguagesPdfIcon,
  LinkedInPdfIcon,
  PhonePdfIcon,
  SkillsPdfIcon,
  WebsitePdfIcon,
  WorkHistoryPdfIcon,
} from "@/components/pdf/PdfIcons";
import { getContrastTextColor, tintBackground } from "@/lib/color";
import { allFields, type FieldKey } from "@/lib/fields";
import { getFontScaleRatio } from "@/lib/fontSize";
import {
  DAISYUI_NEUTRAL,
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

export default function ElegantPdfTemplate({
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

  const sidebarFg = color ? getContrastTextColor(color) : "#ffffff";
  const pillBg = tintBackground(sidebarBg, sidebarFg);
  const fontFamily = font ?? "inter";

  const styles = StyleSheet.create({
    page: { fontFamily, fontSize: s(10), color: RESUME_TEXT_COLOR, flexDirection: "row" },
    main: { flex: 1, padding: 24 },
    sidebar: {

      width: 227,
      backgroundColor: sidebarBg,
      color: sidebarFg,
      padding: 20,
    },
    photo: {
      width: 60,
      height: 60,
      borderRadius: 30,
      objectFit: "cover",
      alignSelf: "center",
      marginBottom: 10,
    },
    name: { fontSize: s(22), fontWeight: "bold" },
    jobTitle: { fontSize: s(11), fontWeight: "bold", color: accentColor ?? GRAY_600, marginTop: 2, marginBottom: 8 },
    contactRow: { flexDirection: "row", flexWrap: "wrap", columnGap: 14, rowGap: 3, marginBottom: 4 },
    contactItem: { flexDirection: "row", alignItems: "center", gap: 4, fontSize: s(8.5), color: GRAY_500 },
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
    numberedLine: { flexDirection: "row", gap: 4, marginTop: 3 },
    numberedIndex: { fontSize: s(9.5), color: GRAY_700 },
    numberedText: { fontSize: s(9.5), color: GRAY_700, flex: 1, lineHeight: 1.4 },
    bodyText: { fontSize: s(10), color: GRAY_700 },
    languageRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
    donutWrap: { position: "relative", alignItems: "center", justifyContent: "center" },
    donutLabelWrap: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
    },
    donutLabel: { fontSize: s(6), fontWeight: "bold" },
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

  const fieldOrder = (visibleFields ?? allFields).filter(
    (key) => key !== "photo" && key !== "aboutMe",
  );
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

  function NumberedLines({ text }: { text: string }) {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return null;
    return (
      <View>
        {lines.map((line, index) => (
          <View key={index} style={styles.numberedLine}>
            <Text style={styles.numberedIndex}>{index + 1}.</Text>
            <Text style={styles.numberedText}>{line}</Text>
          </View>
        ))}
      </View>
    );
  }

  function renderSection(key: SectionKey, zone: "main" | "sidebar"): React.ReactNode {
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
                  {entry.jobDescription && <NumberedLines text={entry.jobDescription} />}
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
                  {entry.description && <Text style={[styles.entryMeta, { color: GRAY_700 }]}>{entry.description}</Text>}
                </View>
              );
            })}
          </View>
        );
      }

      case "skills": {
        if (skillEntries.length === 0) return null;
        if (zone === "sidebar") {
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
        if (zone === "sidebar") {
          return (
            <View key="languages">
              {sidebarSectionHeader(<LanguagesPdfIcon size={s(10)} color={sidebarFg} />, "Languages")}
              {languageEntries.map((entry) => {
                const levelIndex = languageLevels.indexOf(entry.level);
                const percent = Math.round((Math.max(levelIndex, 0) / (languageLevels.length - 1)) * 100);
                return (
                  <View key={entry.id} style={styles.languageRow}>
                    <View style={styles.donutWrap}>
                      <DonutPdfIcon
                        percent={percent}
                        size={s(34)}
                        color={sidebarFg}
                        trackColor={pillBg}
                      />
                      <View style={styles.donutLabelWrap}>
                        <Text style={[styles.donutLabel, { color: sidebarFg }]}>{percent}%</Text>
                      </View>
                    </View>
                    <Text style={styles.sidebarBodyText}>{entry.language}</Text>
                  </View>
                );
              })}
            </View>
          );
        }
        return (
          <View key="languages">
            {mainSectionHeader(<LanguagesPdfIcon size={s(11)} color={accentColor ?? GRAY_500} />, "Languages")}
            {languageEntries.map((entry) => (
              <Text key={entry.id} style={[styles.bodyText, { marginTop: 2 }]}>
                <Text style={{ fontWeight: "bold" }}>{entry.language}</Text>
                <Text style={{ color: GRAY_500 }}> — {entry.level}</Text>
              </Text>
            ))}
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
    }
  }

  const fieldContent: Partial<Record<FieldKey, React.ReactNode>> = {
    name: isVisible("name") && <Text style={styles.name}>{data.name}</Text>,
    jobTitle: data.jobTitle && isVisible("jobTitle") && (
      <Text style={styles.jobTitle}>{data.jobTitle}</Text>
    ),
    phone: data.phone && isVisible("phone") && (
      <View style={styles.contactItem}>
        <PhonePdfIcon size={s(8)} color={GRAY_500} />
        <Text>{data.phone}</Text>
      </View>
    ),
    email: data.email && isVisible("email") && (
      <View style={styles.contactItem}>
        <EmailPdfIcon size={s(8)} color={GRAY_500} />
        <Text>{data.email}</Text>
      </View>
    ),
    address: data.address && isVisible("address") && (
      <View style={styles.contactItem}>
        <AddressPdfIcon size={s(8)} color={GRAY_500} />
        <Text>{data.address}</Text>
      </View>
    ),
    website: data.website && isVisible("website") && (
      <View style={styles.contactItem}>
        <WebsitePdfIcon size={s(8)} color={GRAY_500} />
        <Text>{data.website}</Text>
      </View>
    ),
    linkedin: data.linkedin && isVisible("linkedin") && (
      <View style={styles.contactItem}>
        <LinkedInPdfIcon size={s(8)} color={GRAY_500} />
        <Text>{data.linkedin}</Text>
      </View>
    ),
  };

  const contactKeys: FieldKey[] = ["phone", "email", "address", "website", "linkedin"];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.main}>
          {fieldOrder.map((key) =>
            contactKeys.includes(key) ? null : <View key={key}>{fieldContent[key]}</View>,
          )}
          {fieldOrder.some((key) => contactKeys.includes(key) && fieldContent[key]) && (
            <View style={styles.contactRow}>
              {fieldOrder
                .filter((key) => contactKeys.includes(key))
                .map((key) => (
                  <View key={key}>{fieldContent[key]}</View>
                ))}
            </View>
          )}

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

        <View style={styles.sidebar}>
          {data.photo && isVisible("photo") && (
            // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image, not an HTML img element
            <Image src={data.photo} style={styles.photo} />
          )}

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
      </Page>
    </Document>
  );
}

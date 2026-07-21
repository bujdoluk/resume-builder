
import { Circle, Path, Rect, Svg } from "@react-pdf/renderer";

interface PdfIconProps {
  size?: number;
  color?: string;
}

function IconBase({
  size = 10,
  children,
}: {
  size?: number;
  children: React.ReactNode;
}) {
  return (
    <Svg viewBox="0 0 24 24" style={{ width: size, height: size }}>
      {children}
    </Svg>
  );
}

const strokeProps = (color: string) => ({
  stroke: color,
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none" as const,
});

export function WorkHistoryPdfIcon({ size, color = "#000" }: PdfIconProps) {
  return (
    <IconBase size={size}>
      <Rect
        x={3}
        y={7.5}
        width={18}
        height={12}
        rx={1.5}
        {...strokeProps(color)}
      />
      <Path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5" {...strokeProps(color)} />
      <Path d="M3 12.75h18" {...strokeProps(color)} />
    </IconBase>
  );
}

export function EducationPdfIcon({ size, color = "#000" }: PdfIconProps) {
  return (
    <IconBase size={size}>
      <Path d="m2.25 9 9.75-4.5L21.75 9l-9.75 4.5L2.25 9Z" {...strokeProps(color)} />
      <Path
        d="M6 11.25v4.5c0 .621 2.686 2.25 6 2.25s6-1.629 6-2.25v-4.5"
        {...strokeProps(color)}
      />
      <Path d="M21.75 9v6" {...strokeProps(color)} />
    </IconBase>
  );
}

export function SkillsPdfIcon({ size, color = "#000" }: PdfIconProps) {
  return (
    <IconBase size={size}>
      <Path
        d="m11.48 3.499 2.078 4.5 4.94.719c1.02.148 1.427 1.408.69 2.125l-3.573 3.482.843 4.92c.174 1.016-.9 1.79-1.816 1.31L12 18.354l-4.421 2.326c-.916.48-1.99-.294-1.816-1.31l.843-4.92-3.573-3.482c-.737-.717-.33-1.977.69-2.125l4.94-.719 2.078-4.5c.457-.99 1.902-.99 2.36 0Z"
        {...strokeProps(color)}
      />
    </IconBase>
  );
}

export function CertificationsPdfIcon({ size, color = "#000" }: PdfIconProps) {
  return (
    <IconBase size={size}>
      <Circle cx={12} cy={8} r={5} {...strokeProps(color)} />
      <Path d="m8.5 12.5-1.5 7 5-3 5 3-1.5-7" {...strokeProps(color)} />
    </IconBase>
  );
}

export function LanguagesPdfIcon({ size, color = "#000" }: PdfIconProps) {
  return (
    <IconBase size={size}>
      <Circle cx={12} cy={12} r={9} {...strokeProps(color)} />
      <Path
        d="M3 12h18M12 3c2.5 2.5 3.75 5.5 3.75 9s-1.25 6.5-3.75 9c-2.5-2.5-3.75-5.5-3.75-9S9.5 5.5 12 3Z"
        {...strokeProps(color)}
      />
    </IconBase>
  );
}

export function InterestsPdfIcon({ size, color = "#000" }: PdfIconProps) {
  return (
    <IconBase size={size}>
      <Path
        d="M12 20.25c-.318 0-.633-.088-.906-.262C7.499 17.577 3 14.15 3 9.75 3 7.026 5.132 4.9 7.79 4.9c1.6 0 3.049.789 3.96 2.017a.7.7 0 0 0 .5.208.7.7 0 0 0 .5-.208A4.897 4.897 0 0 1 16.71 4.9C19.368 4.9 21.5 7.026 21.5 9.75c0 4.4-4.5 7.827-8.594 10.238-.273.174-.588.262-.906.262Z"
        {...strokeProps(color)}
      />
    </IconBase>
  );
}

export function PhonePdfIcon({ size, color = "#000" }: PdfIconProps) {
  return (
    <IconBase size={size}>
      <Path
        d="M2.25 6.75c0 8.284 6.716 15 15 15h1.5a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293a12.045 12.045 0 0 1-5.688-5.688l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
        {...strokeProps(color)}
      />
    </IconBase>
  );
}

export function EmailPdfIcon({ size, color = "#000" }: PdfIconProps) {
  return (
    <IconBase size={size}>
      <Path
        d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
        {...strokeProps(color)}
      />
    </IconBase>
  );
}

export function AddressPdfIcon({ size, color = "#000" }: PdfIconProps) {
  return (
    <IconBase size={size}>
      <Path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" {...strokeProps(color)} />
      <Path
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
        {...strokeProps(color)}
      />
    </IconBase>
  );
}

export function WebsitePdfIcon({ size, color = "#000" }: PdfIconProps) {
  return (
    <IconBase size={size}>
      <Path
        d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A8.959 8.959 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
        {...strokeProps(color)}
      />
    </IconBase>
  );
}

export function LinkedInPdfIcon({ size, color = "#000" }: PdfIconProps) {
  return (
    <IconBase size={size}>
      <Path
        d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
        {...strokeProps(color)}
      />
    </IconBase>
  );
}

export function AboutMePdfIcon({ size, color = "#000" }: PdfIconProps) {
  return (
    <IconBase size={size}>
      <Path
        d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        {...strokeProps(color)}
      />
    </IconBase>
  );
}

const STAR_PATH =
  "M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354l-4.63 2.822c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.007Z";

export function DonutPdfIcon({
  percent,
  size = 24,
  color = "#000",
  trackColor = "#888888",
}: {
  percent: number;
  size?: number;
  color?: string;
  trackColor?: string;
}) {

  const r = 10;
  const strokeWidth = 2;
  const circumference = 2 * Math.PI * r;
  const filledLength = (circumference * Math.max(0, Math.min(100, percent))) / 100;

  return (
    <Svg viewBox="0 0 24 24" style={{ width: size, height: size }}>
      <Circle
        cx={12}
        cy={12}
        r={r}
        stroke={trackColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={12}
        cy={12}
        r={r}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${filledLength} ${circumference}`}
        transform="rotate(-90 12 12)"
      />
    </Svg>
  );
}

export function StarRatingPdfIcon({
  filled,
  total,
  size = 8,
  color = "#000",
}: {
  filled: number;
  total: number;
  size?: number;
  color?: string;
}) {
  return (
    <Svg viewBox={`0 0 ${24 * total} 24`} style={{ width: size * total, height: size }}>
      {Array.from({ length: total }, (_, i) => (
        <Path
          key={i}
          transform={`translate(${24 * i}, 0)`}
          d={STAR_PATH}
          fill={color}
          fillOpacity={i < filled ? 1 : 0.2}
        />
      ))}
    </Svg>
  );
}

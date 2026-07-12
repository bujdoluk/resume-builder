/**
 * Scales an A4-sized template preview down to fit a fixed thumbnail width,
 * used by the `/templates` gallery to show each template at a consistent
 * small size regardless of its full-page dimensions.
 */
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MM_TO_PX = 96 / 25.4;

interface TemplateThumbnailProps {
  width: number;
  children: React.ReactNode;
}

export default function TemplateThumbnail({
  width,
  children,
}: TemplateThumbnailProps) {
  const scale = width / (A4_WIDTH_MM * MM_TO_PX);
  const height = A4_HEIGHT_MM * MM_TO_PX * scale;

  return (
    <div
      className="border-base-300 bg-base-100 relative overflow-hidden rounded-lg border shadow-sm"
      style={{ width, height }}
    >
      <div
        className="origin-top-left"
        style={{ transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

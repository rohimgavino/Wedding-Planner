import Image from "next/image";

/** Cropped from the supplied raster; not a reconstructed vector. */
export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return <><span className={compact ? "pp-logo pp-logo-compact" : "pp-logo pp-logo-default"}><Image src={compact ? "/icons/pocket-planner-64.png?v=pp-alpha-1" : "/images/pocket-planner-logo.png?v=pp-alpha-1"} alt="Pocket Planner" width={compact ? 64 : 320} height={compact ? 64 : 194} unoptimized /></span>{!compact && <span className="pp-logo pp-logo-light"><Image src="/images/pocket-planner-logo-light.png?v=pp-alpha-1" alt="Pocket Planner" width={320} height={194} unoptimized /></span>}</>;
}

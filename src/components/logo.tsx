import Image from "next/image";

type LogoProps = {
  size?: number;
  variant?: "mark" | "full";
  className?: string;
};

/**
 * VendorBeacon logo — uses the real uploaded logo image (white VB mark on
 * green rounded-square background).
 *
 * variant="mark"  → icon only
 * variant="full"  → icon + "VendorBeacon" wordmark side by side
 */
export function Logo({ size = 40, variant = "mark", className = "" }: LogoProps) {
  const mark = (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.2,
        background: "#639922",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      <Image
        src="/logo.png"
        alt="VendorBeacon"
        width={size}
        height={size}
        style={{ objectFit: "contain", padding: size * 0.08 }}
        priority
      />
    </div>
  );

  if (variant === "mark") {
    return <div className={className}>{mark}</div>;
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {mark}
      <span
        style={{
          fontSize: size * 0.42,
          fontWeight: 600,
          color: "#2C2C2A",
          letterSpacing: "-0.01em",
        }}
      >
        VendorBeacon
      </span>
    </div>
  );
}

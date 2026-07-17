import Image from "next/image";

type Props = {
  className?: string;
  priority?: boolean;
  variant?: "header" | "footer" | "splash" | "mark";
};

const SIZES = {
  header: { width: 160, height: 24, src: "/orient-logo.png", className: "h-7 w-auto sm:h-8" },
  footer: { width: 180, height: 27, src: "/orient-logo.png", className: "h-8 w-auto" },
  splash: { width: 320, height: 47, src: "/orient-logo@2x.png", className: "h-14 w-auto sm:h-16" },
  mark: { width: 96, height: 96, src: "/orient-mark.png", className: "h-20 w-20 sm:h-24 sm:w-24" },
} as const;

export function BrandLogo({ className = "", priority, variant = "header" }: Props) {
  const s = SIZES[variant];
  return (
    <Image
      src={s.src}
      alt="Orient Lighting"
      width={s.width}
      height={s.height}
      priority={priority}
      className={`${s.className} ${className}`.trim()}
    />
  );
}

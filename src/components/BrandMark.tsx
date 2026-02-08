import { cn } from "@/lib/utils";

interface BrandMarkProps {
  size?: number;
  className?: string;
  alt?: string;
}

const BrandMark = ({ size = 40, className, alt = "Studyshare logo" }: BrandMarkProps) => {
  return (
    <img
      src="/brand/logo-mark.png"
      alt={alt}
      width={size}
      height={size}
      className={cn("object-contain", className)}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        const target = e.currentTarget;
        if (target.src.includes("logo-mark.png")) {
          target.src = "/brand/app-icon.png";
        }
      }}
    />
  );
};

export default BrandMark;

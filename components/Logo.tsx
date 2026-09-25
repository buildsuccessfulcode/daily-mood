import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  size?: number;
  className?: string;
  alt?: string;
};

export function Logo({ size = 36, className, alt = "Daily Mood" }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt={alt}
      width={size}
      height={size}
      unoptimized
      className={cn("rounded-[22%] object-cover", className)}
    />
  );
}

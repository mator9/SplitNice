"use client";

import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const pixelSizes = { sm: 32, md: 40, lg: 56 };

export default function Avatar({ src, name, size = "md", className = "" }: AvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-[10px]",
    md: "w-10 h-10 text-xs",
    lg: "w-14 h-14 text-base",
  };
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const colors = [
    "bg-emerald-600", "bg-blue-600", "bg-violet-600", "bg-amber-600",
    "bg-rose-600", "bg-cyan-600", "bg-indigo-600", "bg-pink-600",
  ];
  const colorIdx = name ? name.charCodeAt(0) % colors.length : 0;

  if (src) {
    return (
      <Image
        src={src}
        alt={name || "Avatar"}
        width={pixelSizes[size]}
        height={pixelSizes[size]}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
        referrerPolicy="no-referrer"
        unoptimized
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${colors[colorIdx]} rounded-full flex items-center justify-center text-white font-semibold shrink-0 ${className}`}
    >
      {initials}
    </div>
  );
}

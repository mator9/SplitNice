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
  const sizeClasses = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-lg" };
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const colors = [
    "bg-emerald-500", "bg-blue-500", "bg-purple-500", "bg-orange-500",
    "bg-pink-500", "bg-cyan-500", "bg-indigo-500", "bg-rose-500",
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
      className={`${sizeClasses[size]} ${colors[colorIdx]} rounded-full flex items-center justify-center text-white font-medium ${className}`}
    >
      {initials}
    </div>
  );
}

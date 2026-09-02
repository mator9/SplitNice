"use client";

import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export default function Card({ children, className = "", onClick, hover }: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-slate-800/80 rounded-xl border border-gray-100 dark:border-slate-700/60 shadow-xs
        ${hover ? "hover:shadow-sm hover:border-gray-200 dark:hover:border-slate-600 transition-all duration-150 cursor-pointer active:scale-[0.99]" : ""}
        ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

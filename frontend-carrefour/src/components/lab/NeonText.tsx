import type { ReactNode } from "react";

interface NeonTextProps {
  color?: "green" | "cyan" | "plasma" | "warn" | "blood";
  children: ReactNode;
  className?: string;
  as?: "span" | "div" | "h1" | "h2" | "h3";
}

const colorClass = {
  green: "neon-green",
  cyan: "neon-cyan",
  plasma: "neon-plasma",
  warn: "neon-warn",
  blood: "neon-blood",
};

export default function NeonText({ color = "green", children, className = "", as: Tag = "span" }: NeonTextProps) {
  return <Tag className={`${colorClass[color]} ${className}`}>{children}</Tag>;
}

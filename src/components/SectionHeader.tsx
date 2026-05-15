import { type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  as?: "h2" | "h3";
};

export function SectionHeader({ children, className = "", as: Tag = "h2" }: Props) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Tag className="text-[#ff6f00] font-bold whitespace-nowrap">{children}</Tag>
      <span className="flex-1 h-px bg-[#ff6f00]/40" />
    </div>
  );
}

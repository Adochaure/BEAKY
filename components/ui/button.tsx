import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "outline";
  size?: "default" | "small";
};

export function Button({
  children,
  className = "",
  variant = "primary",
  size = "default",
  ...props
}: ButtonProps) {
  const sizing =
    size === "small"
      ? "min-h-8 rounded-[9px] px-3 text-[10px]"
      : "min-h-11 rounded-[14px] px-5 text-xs";
  const styles =
    variant === "primary"
      ? "border border-[#cf3340] bg-[#e63946] text-white shadow-[0_2px_4px_rgba(23,43,50,0.12)] ring-1 ring-[#a92230] hover:bg-[#bd2634] active:translate-y-px"
      : "border border-[#d8dfd8] bg-white/70 text-[#263a3d] hover:border-[#9aaca3] hover:bg-white";

  return (
    <button
      className={`inline-flex items-center justify-center gap-2.5 font-semibold transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e63946] disabled:cursor-not-allowed disabled:opacity-55 ${sizing} ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

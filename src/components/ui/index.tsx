import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "standard";
}

export const Card: React.FC<CardProps> = ({ children, className = "", padding = "standard" }) => {
  return (
    <div className={cn(
      "nexus-card overflow-hidden",
      padding === "standard" && "p-6",
      className
    )}>
      {children}
    </div>
  );
};

interface BadgeProps {
  children: React.ReactNode;
  variant: "active" | "pending" | "dispute" | "frozen";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant, className }) => {
  const variants = {
    active: "badge badge-active",
    pending: "badge badge-pending",
    dispute: "badge badge-dispute",
    frozen: "badge badge-frozen",
  };

  return (
    <span className={cn(variants[variant], className)}>
      {children}
    </span>
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "link" | "outline";
  size?: "default" | "sm" | "lg" | "icon" | string;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = "primary", size, children, className = "", ...props }) => {
  const variants: Record<string, string> = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
    danger: "bg-white text-primary-900 border border-primary-900 hover:bg-primary-100 px-4 py-2 rounded-[6px] transition-colors font-bold",
    link: "text-primary-900 hover:text-primary-800",
    outline: "border border-primary-900 bg-transparent hover:bg-primary-100 text-primary-900 px-4 py-2 rounded-[6px]",
  };

  return (
    <button 
      className={cn(
        variants[variant || "primary"], 
        "flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )} 
      {...props}
    >
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = "", ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="nexus-label">{label}</label>}
      <input className={cn("nexus-input", className)} {...props} />
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
};

interface TableProps {
  headers: string[];
  children: React.ReactNode;
}

export const Table: React.FC<TableProps> = ({ headers, children }) => {
  return (
    <div className="w-full border border-border-light rounded-[6px] overflow-hidden bg-white">
      <table className="w-full text-left border-collapse">
        <thead className="bg-primary-100 border-b border-border-light">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-6 py-4 text-xs font-bold text-primary-900 uppercase tracking-widest border-b border-border-light">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light">
          {children}
        </tbody>
      </table>
    </div>
  );
};

export const TableRow: React.FC<{ children: React.ReactNode; onClick?: () => void; className?: string }> = ({ children, onClick, className }) => (
  <tr 
    onClick={onClick}
    className={cn(
      "hover:bg-primary-100 transition-colors duration-200 group",
      onClick && "cursor-pointer",
      className
    )}
  >
    {children}
  </tr>
);

export const TableCell: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <td className={cn("px-6 py-4 text-sm text-primary-900", className)}>
    {children}
  </td>
);

"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

// ─── BUTTON ─────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "dark";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  as?: "button" | "a";
  href?: string;
  target?: string;
}

const btnBase = "inline-flex items-center justify-center gap-2 font-semibold rounded-full border-0 cursor-pointer transition-all select-none whitespace-nowrap";

const btnVariants: Record<ButtonVariant, string> = {
  primary: "",
  secondary: "",
  ghost: "",
  danger: "",
  dark: "",
};

const btnSizes: Record<ButtonSize, { padding: string; fontSize: string; height: string }> = {
  sm: { padding: "0 14px", fontSize: "12px", height: "32px" },
  md: { padding: "0 20px", fontSize: "14px", height: "40px" },
  lg: { padding: "0 28px", fontSize: "15px", height: "48px" },
};

const btnStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: { background: "var(--green)", color: "var(--green-dark)" },
  secondary: { background: "var(--green-light)", color: "var(--green-mid)", border: "1px solid var(--green-border)" },
  ghost: { background: "transparent", color: "var(--text-2)", border: "1px solid var(--border-2)" },
  danger: { background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid var(--danger)" },
  dark: { background: "var(--dark-2)", color: "var(--text-on-dark)" },
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  fullWidth,
  children,
  disabled,
  style,
  as,
  href,
  target,
  ...props
}: ButtonProps) {
  const sz = btnSizes[size];
  const combined: React.CSSProperties = {
    ...btnStyles[variant],
    padding: sz.padding,
    fontSize: sz.fontSize,
    height: sz.height,
    width: fullWidth ? "100%" : undefined,
    opacity: disabled || loading ? 0.6 : 1,
    cursor: disabled || loading ? "not-allowed" : "pointer",
    boxShadow: variant === "primary" ? "0 1px 3px rgba(57,255,20,0.3)" : undefined,
    ...style,
  };

  const content = (
    <>
      {loading ? (
        <span style={{ width: 14, height: 14, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block" }} className="animate-spin" />
      ) : icon ? (
        <span style={{ display: "flex", alignItems: "center" }}>{icon}</span>
      ) : null}
      {children}
    </>
  );

  if (as === "a" || href) {
    return (
      <a href={href} target={target} style={combined} className={btnBase}>
        {content}
      </a>
    );
  }

  return (
    <button {...props} disabled={disabled || loading} style={combined} className={btnBase}>
      {content}
    </button>
  );
}

// ─── CARD ───────────────────────────────────────────────────────────────────

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "dark" | "green" | "ghost";
  padding?: "sm" | "md" | "lg" | "none";
  hoverable?: boolean;
}

const cardVariantStyles: Record<string, React.CSSProperties> = {
  default: { background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" },
  dark: { background: "var(--dark-2)", border: "1px solid var(--border-dark)" },
  green: { background: "var(--green)", border: "1px solid var(--green-border)" },
  ghost: { background: "transparent", border: "1px solid var(--border)" },
};

const cardPadding = { sm: "12px", md: "20px", lg: "28px", none: "0" };

export function Card({ variant = "default", padding = "md", hoverable, children, style, className, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={`animate-fade-in ${className || ""}`}
      style={{
        borderRadius: "var(--r-lg)",
        padding: cardPadding[padding],
        transition: hoverable ? "transform var(--t), box-shadow var(--t)" : undefined,
        ...cardVariantStyles[variant],
        ...style,
      }}
      onMouseEnter={hoverable ? (e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)"; } : undefined}
      onMouseLeave={hoverable ? (e) => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = cardVariantStyles[variant].boxShadow as string || ""; } : undefined}
    >
      {children}
    </div>
  );
}

// ─── INPUT ──────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: string;
  suffix?: React.ReactNode;
}

export function Input({ label, error, hint, prefix, suffix, style, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label htmlFor={inputId} style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {prefix && (
          <span style={{ position: "absolute", left: 12, fontSize: 13, color: "var(--text-3)", pointerEvents: "none" }}>
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          {...props}
          style={{
            width: "100%",
            height: 44,
            padding: prefix ? "0 12px 0 32px" : "0 12px",
            fontSize: 14,
            color: "var(--text)",
            background: "var(--surface)",
            border: `1px solid ${error ? "var(--danger)" : "var(--border-2)"}`,
            borderRadius: "var(--r-md)",
            outline: "none",
            transition: "border-color var(--t), box-shadow var(--t)",
            ...style,
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--green)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(57,255,20,0.15)"; props.onFocus?.(e); }}
          onBlur={(e) => { e.currentTarget.style.borderColor = error ? "var(--danger)" : "var(--border-2)"; e.currentTarget.style.boxShadow = "none"; props.onBlur?.(e); }}
        />
        {suffix && (
          <span style={{ position: "absolute", right: 12 }}>{suffix}</span>
        )}
      </div>
      {error && <span style={{ fontSize: 12, color: "var(--danger)", display: "flex", alignItems: "center", gap: 4 }}>⚠ {error}</span>}
      {hint && !error && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{hint}</span>}
    </div>
  );
}

// ─── TEXTAREA ───────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, style, id, ...props }: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <label htmlFor={inputId} style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>{label}</label>}
      <textarea
        id={inputId}
        {...props}
        style={{
          width: "100%",
          padding: "12px",
          fontSize: 14,
          color: "var(--text)",
          background: "var(--surface)",
          border: `1px solid ${error ? "var(--danger)" : "var(--border-2)"}`,
          borderRadius: "var(--r-md)",
          outline: "none",
          resize: "vertical",
          minHeight: 100,
          transition: "border-color var(--t), box-shadow var(--t)",
          fontFamily: "inherit",
          ...style,
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--green)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(57,255,20,0.15)"; props.onFocus?.(e); }}
        onBlur={(e) => { e.currentTarget.style.borderColor = error ? "var(--danger)" : "var(--border-2)"; e.currentTarget.style.boxShadow = "none"; props.onBlur?.(e); }}
      />
      {error && <span style={{ fontSize: 12, color: "var(--danger)" }}>⚠ {error}</span>}
      {hint && !error && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{hint}</span>}
    </div>
  );
}

// ─── SELECT ─────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, hint, options, style, id, ...props }: SelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <label htmlFor={inputId} style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>{label}</label>}
      <select
        id={inputId}
        {...props}
        style={{
          width: "100%",
          height: 44,
          padding: "0 36px 0 12px",
          fontSize: 14,
          color: "var(--text)",
          background: "var(--surface)",
          border: `1px solid ${error ? "var(--danger)" : "var(--border-2)"}`,
          borderRadius: "var(--r-md)",
          outline: "none",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%235A6A5A' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
          cursor: "pointer",
          transition: "border-color var(--t)",
          ...style,
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <span style={{ fontSize: 12, color: "var(--danger)" }}>⚠ {error}</span>}
      {hint && !error && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{hint}</span>}
    </div>
  );
}

// ─── CHECKBOX ───────────────────────────────────────────────────────────────

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}

export function Checkbox({ label, description, id, ...props }: CheckboxProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label htmlFor={inputId} style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
      <input
        type="checkbox"
        id={inputId}
        {...props}
        style={{
          width: 18,
          height: 18,
          marginTop: 1,
          accentColor: "var(--green)",
          cursor: "pointer",
          flexShrink: 0,
        }}
      />
      <span>
        <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{label}</span>
        {description && <span style={{ display: "block", fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{description}</span>}
      </span>
    </label>
  );
}

// ─── BADGE ──────────────────────────────────────────────────────────────────

type BadgeVariant = "green" | "dark" | "ghost" | "warning" | "danger" | "pro";

const badgeStyles: Record<BadgeVariant, React.CSSProperties> = {
  green: { background: "var(--green)", color: "var(--green-dark)" },
  dark: { background: "var(--dark-2)", color: "var(--text-on-dark)" },
  ghost: { background: "transparent", color: "var(--text-3)", border: "1px solid var(--border-2)" },
  warning: { background: "var(--warning-bg)", color: "var(--warning)" },
  danger: { background: "var(--danger-bg)", color: "var(--danger)" },
  pro: { background: "var(--green)", color: "var(--green-dark)" },
};

export function Badge({ variant = "ghost", children, style }: { variant?: BadgeVariant; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "3px 10px",
      borderRadius: "var(--r-full)",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: ".02em",
      ...badgeStyles[variant],
      ...style,
    }}>
      {children}
    </span>
  );
}

// ─── SPINNER ────────────────────────────────────────────────────────────────

export function Spinner({ size = 20, color = "var(--green)" }: { size?: number; color?: string }) {
  return (
    <span style={{
      display: "inline-block",
      width: size,
      height: size,
      border: `2px solid ${color}30`,
      borderTopColor: color,
      borderRadius: "50%",
    }} className="animate-spin" />
  );
}

// ─── SKELETON ───────────────────────────────────────────────────────────────

export function Skeleton({ width = "100%", height = 16, radius = 8, style }: { width?: string | number; height?: number; radius?: number; style?: React.CSSProperties }) {
  return (
    <div style={{
      width,
      height,
      borderRadius: radius,
      background: "linear-gradient(90deg, var(--border) 25%, var(--border-2) 50%, var(--border) 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
      ...style,
    }} />
  );
}

// ─── EMPTY STATE ────────────────────────────────────────────────────────────

export function EmptyState({ icon, title, description, action }: {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px" }} className="animate-fade-in">
      {icon && <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.8 }}>{icon}</div>}
      <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-2)", marginBottom: description ? 8 : 20 }}>{title}</p>
      {description && <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 20, maxWidth: 280, margin: "0 auto 20px" }}>{description}</p>}
      {action && (
        <Button onClick={action.onClick} size="md">{action.label}</Button>
      )}
    </div>
  );
}

// ─── STAT CARD ──────────────────────────────────────────────────────────────

export function StatCard({ label, value, sub, variant = "default", action }: {
  label: string;
  value: string | number;
  sub?: string;
  variant?: "default" | "dark" | "green";
  action?: { label: string; href: string };
}) {
  const styles = {
    default: { bg: "var(--surface)", labelColor: "var(--text-3)", valueColor: "var(--text)", subColor: "var(--green-mid)" },
    dark: { bg: "var(--dark-2)", labelColor: "var(--text-on-dark-3)", valueColor: "var(--text-on-dark)", subColor: "var(--green)" },
    green: { bg: "var(--green)", labelColor: "var(--green-dark)", valueColor: "var(--green-dark)", subColor: "var(--green-dark)" },
  }[variant];

  return (
    <div style={{
      background: styles.bg,
      borderRadius: "var(--r-lg)",
      padding: "16px 18px",
      border: variant === "default" ? "1px solid var(--border)" : undefined,
      boxShadow: variant === "default" ? "var(--shadow-sm)" : undefined,
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: styles.labelColor, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: 700, color: styles.valueColor, lineHeight: 1, marginBottom: 4 }}>{value}</p>
      {sub && (
        <a href={action?.href} style={{ fontSize: 12, fontWeight: 600, color: styles.subColor, textDecoration: "none" }}>
          {sub} {action ? "→" : ""}
        </a>
      )}
    </div>
  );
}

// ─── PAGE HEADER ────────────────────────────────────────────────────────────

export function PageHeader({ title, description, action }: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: description ? 4 : 0 }}>{title}</h1>
        {description && <p style={{ fontSize: 14, color: "var(--text-3)" }}>{description}</p>}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

// ─── SECTION ────────────────────────────────────────────────────────────────

export function Section({ title, description, children, action }: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {(title || action) && (
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            {title && <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{title}</h2>}
            {description && <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 2 }}>{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── DIVIDER ────────────────────────────────────────────────────────────────

export function Divider({ style }: { style?: React.CSSProperties }) {
  return <div style={{ height: 1, background: "var(--border)", ...style }} />;
}

// ─── LIST ITEM ──────────────────────────────────────────────────────────────

export function ListItem({ icon, title, subtitle, right, onClick, href }: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const content = (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 16px",
      background: "var(--surface)",
      borderRadius: "var(--r-md)",
      border: "1px solid var(--border)",
      cursor: onClick || href ? "pointer" : "default",
      transition: "background var(--t)",
    }}
      onMouseEnter={e => { if (onClick || href) (e.currentTarget as HTMLDivElement).style.background = "var(--green-light)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "var(--surface)"; }}
    >
      {icon && <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: "var(--r-sm)", background: "var(--green-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: subtitle ? 2 : 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</p>
        {subtitle && <p style={{ fontSize: 12, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtitle}</p>}
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  );

  if (href) return <a href={href} style={{ textDecoration: "none" }}>{content}</a>;
  if (onClick) return <div onClick={onClick}>{content}</div>;
  return content;
}

// ─── PROGRESS BAR ───────────────────────────────────────────────────────────

export function ProgressBar({ value, max = 100, label, showValue }: { value: number; max?: number; label?: string; showValue?: boolean }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      {(label || showValue) && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          {label && <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>{label}</span>}
          {showValue && <span style={{ fontSize: 13, fontWeight: 700, color: "var(--green-mid)" }}>{pct}%</span>}
        </div>
      )}
      <div style={{ height: 8, background: "var(--border)", borderRadius: "var(--r-full)", overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: "var(--green)",
          borderRadius: "var(--r-full)",
          transition: "width 600ms ease",
        }} />
      </div>
    </div>
  );
}

// ─── TABS ───────────────────────────────────────────────────────────────────

export function Tabs({ tabs, active, onChange }: {
  tabs: { value: string; label: string; count?: number }[];
  active: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 4, background: "var(--surface-2)", padding: "4px", borderRadius: "var(--r-lg)", border: "1px solid var(--border)" }}>
      {tabs.map(t => (
        <button key={t.value} onClick={() => onChange(t.value)} style={{
          flex: 1,
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          borderRadius: "var(--r-md)",
          border: "none",
          fontSize: 13,
          fontWeight: active === t.value ? 700 : 500,
          cursor: "pointer",
          transition: "all var(--t)",
          background: active === t.value ? "var(--green)" : "transparent",
          color: active === t.value ? "var(--green-dark)" : "var(--text-3)",
          boxShadow: active === t.value ? "var(--shadow-sm)" : "none",
        }}>
          {t.label}
          {t.count !== undefined && t.count > 0 && (
            <span style={{
              minWidth: 18,
              height: 18,
              padding: "0 5px",
              borderRadius: "var(--r-full)",
              background: active === t.value ? "var(--green-dark)" : "var(--dark-2)",
              color: active === t.value ? "var(--green)" : "var(--text-on-dark)",
              fontSize: 10,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {t.count > 99 ? "99+" : t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── TOAST ──────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<{ toast: (message: string, type?: ToastType) => void }>({
  toast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const toastIcons = { success: "✓", error: "✕", info: "ℹ", warning: "⚠" };
  const toastColors: Record<ToastType, React.CSSProperties> = {
    success: { background: "var(--dark-2)", borderLeft: "3px solid var(--green)" },
    error: { background: "var(--dark-2)", borderLeft: "3px solid var(--danger)" },
    info: { background: "var(--dark-2)", borderLeft: "3px solid #4A90E2" },
    warning: { background: "var(--dark-2)", borderLeft: "3px solid var(--warning)" },
  };
  const iconColors: Record<ToastType, string> = {
    success: "var(--green)", error: "var(--danger)", info: "#4A90E2", warning: "var(--warning)",
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
        {toasts.map(t => (
          <div key={t.id} className="animate-slide-up" style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 18px",
            borderRadius: "var(--r-md)",
            boxShadow: "var(--shadow-lg)",
            minWidth: 240,
            maxWidth: 360,
            ...toastColors[t.type],
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: iconColors[t.type], flexShrink: 0 }}>{toastIcons[t.type]}</span>
            <span style={{ fontSize: 14, color: "var(--text-on-dark)" }}>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

// ─── MODAL ──────────────────────────────────────────────────────────────────

export function Modal({ open, onClose, title, children, footer }: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }} onClick={onClose}>
      <div className="animate-slide-up" style={{
        background: "var(--surface)",
        borderRadius: "var(--r-xl)",
        width: "100%",
        maxWidth: 480,
        maxHeight: "90vh",
        overflow: "auto",
        boxShadow: "var(--shadow-lg)",
      }} onClick={e => e.stopPropagation()}>
        {title && (
          <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>{title}</h3>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--text-3)", lineHeight: 1, padding: 4 }}>✕</button>
          </div>
        )}
        <div style={{ padding: "20px 24px" }}>{children}</div>
        {footer && <div style={{ padding: "16px 24px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>{footer}</div>}
      </div>
    </div>
  );
}

// ─── ALERT BANNER ───────────────────────────────────────────────────────────

export function AlertBanner({ type = "info", title, description, action }: {
  type?: "success" | "warning" | "danger" | "info";
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  const styles = {
    success: { bg: "var(--dark-2)", border: "var(--green)", icon: "✓", iconColor: "var(--green)" },
    warning: { bg: "var(--warning-bg)", border: "var(--warning)", icon: "⚠", iconColor: "var(--warning)" },
    danger: { bg: "var(--danger-bg)", border: "var(--danger)", icon: "✕", iconColor: "var(--danger)" },
    info: { bg: "var(--surface-2)", border: "var(--border-2)", icon: "ℹ", iconColor: "var(--green-mid)" },
  }[type];

  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      padding: "14px 16px",
      borderRadius: "var(--r-md)",
      background: styles.bg,
      borderLeft: `3px solid ${styles.border}`,
    }}>
      <span style={{ fontSize: 16, color: styles.iconColor, flexShrink: 0, fontWeight: 700, marginTop: 1 }}>{styles.icon}</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: type === "success" ? "var(--text-on-dark)" : "var(--text)", marginBottom: description ? 4 : 0 }}>{title}</p>
        {description && <p style={{ fontSize: 13, color: type === "success" ? "var(--text-on-dark-2)" : "var(--text-3)" }}>{description}</p>}
      </div>
      {action && (
        <button onClick={action.onClick} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: styles.iconColor, flexShrink: 0 }}>
          {action.label}
        </button>
      )}
    </div>
  );
}

"use client";

import type { ReactNode } from "react";

/** Shared form primitives for the Studio. All token-styled so the admin
 * surface inherits whatever realm/appearance is active. */

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between">
        <span className="font-mono text-[10px] tracking-[0.16em] text-mut uppercase">{label}</span>
        {hint && <span className="font-sans text-[11px] text-mut/70">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-ln bg-transparent px-3 py-2 font-sans text-[14px] text-ink outline-none transition-colors focus:border-acc placeholder:text-mut/60";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} min-h-[84px] resize-y ${props.className ?? ""}`} />;
}

export function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputCls} appearance-none`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[color:var(--bg)] text-ink">
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  // color inputs only accept #rrggbb; rgba tokens fall back to a text field
  const isHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        {isHex && (
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 w-9 flex-none cursor-pointer rounded-lg border border-ln bg-transparent p-0"
            aria-label={`${label} swatch`}
          />
        )}
        <TextInput value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} />
      </div>
    </Field>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3"
    >
      <span
        className="relative h-5 w-9 flex-none rounded-full border border-ln transition-colors"
        style={{ background: checked ? "var(--acc)" : "transparent" }}
      >
        <span
          className="absolute top-0.5 h-3.5 w-3.5 rounded-full bg-ink transition-all"
          style={{ left: checked ? "18px" : "3px", background: checked ? "var(--bg)" : "var(--mut)" }}
        />
      </span>
      <span className="font-sans text-[14px] text-ink">{label}</span>
    </button>
  );
}

export function Btn({
  children,
  onClick,
  variant = "ghost",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "ghost" | "solid" | "danger";
  type?: "button" | "submit";
}) {
  const base =
    "rounded-full px-4 py-2 font-mono text-[10.5px] tracking-[0.12em] uppercase transition-colors";
  const cls =
    variant === "solid"
      ? "bg-acc text-[color:var(--bg)] hover:opacity-90"
      : variant === "danger"
        ? "border border-red-500/40 text-red-400 hover:border-red-500 hover:text-red-300"
        : "border border-ln text-mut hover:border-acc hover:text-ink";
  return (
    <button type={type} onClick={onClick} className={`${base} ${cls}`}>
      {children}
    </button>
  );
}

export function Card({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <section className="border border-ln p-5" style={{ borderRadius: "var(--radius, 16px)" }}>
      <h3 className="font-display text-[15px] font-medium text-ink">{title}</h3>
      {desc && <p className="mt-0.5 mb-4 font-sans text-[13px] leading-relaxed text-mut">{desc}</p>}
      <div className={desc ? "" : "mt-4"}>{children}</div>
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import cls from "./Dropdown.module.css";

type Option = { label: string; value: string };

export default function Dropdown({
  options,
  value,
  onChange,
  ariaLabel,
  align = "left",
  className = "",
}: {
  options: Option[];
  value?: string;
  onChange?: (value: string) => void;
  ariaLabel?: string;
  align?: "left" | "right";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const selected = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const handleSelect = (val: string) => {
    onChange?.(val);
    setOpen(false);
  };

  return (
    <div ref={ref} className={`${cls.dropdown} ${open ? cls.open : ""} ${className}`}>
      {ariaLabel ? <span className={cls.srOnly}>{ariaLabel}</span> : null}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cls.trigger}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={cls.label}>{selected?.label}</span>
        <svg className={cls.chevron} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          className={`${cls.menu} ${align === "right" ? cls.menuRight : ""}`}
        >
          {options.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === selected?.value}
              className={cls.item}
              onClick={() => handleSelect(opt.value)}
            >
              <span className={cls.label}>{opt.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
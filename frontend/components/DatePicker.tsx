"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIsoDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function formatDisplay(iso: string): string {
  const d = parseIsoDate(iso);
  if (!d) return "";
  return `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`;
}

interface DatePickerProps {
  value: string | null;
  onChange: (iso: string | null) => void;
  className?: string;
}

export default function DatePicker({ value, onChange, className = "" }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseIsoDate(value) : null;
  const [viewDate, setViewDate] = useState(() => selected ?? new Date());
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function openPicker() {
    setViewDate(selected ?? new Date());
    setOpen(true);
  }

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className={`relative inline-block ${className}`} ref={rootRef}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        className="flex items-center gap-1.5 border border-slate-300 rounded-md px-2 py-1 text-xs text-left bg-white hover:border-navy-700 transition-colors min-w-[112px]"
      >
        <Calendar size={13} className="text-slate-400 shrink-0" />
        <span className={value ? "text-slate-700" : "text-slate-400"}>
          {value ? formatDisplay(value) : "Set date"}
        </span>
        {value && (
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="ml-auto text-slate-300 hover:text-red-500"
          >
            <X size={12} />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute z-20 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3 w-64">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="p-1 rounded hover:bg-slate-100 text-slate-500"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-sm font-medium text-navy-900">
              {MONTH_NAMES[month]} {year}
            </div>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="p-1 rounded hover:bg-slate-100 text-slate-500"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center">
            {WEEKDAY_LABELS.map((w, i) => (
              <div key={i} className="text-[10px] font-medium text-slate-400 pb-1">
                {w}
              </div>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <div key={i} />;
              const cellDate = new Date(year, month, day);
              const isSelected = selected && toIsoDate(selected) === toIsoDate(cellDate);
              const isToday = toIsoDate(today) === toIsoDate(cellDate);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onChange(toIsoDate(cellDate));
                    setOpen(false);
                  }}
                  className={`text-xs w-7 h-7 mx-auto rounded-full flex items-center justify-center transition-colors ${
                    isSelected
                      ? "bg-navy-900 text-white font-medium"
                      : isToday
                      ? "border border-navy-700 text-navy-900"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              onChange(toIsoDate(today));
              setOpen(false);
            }}
            className="mt-2 text-xs text-navy-700 hover:underline"
          >
            Today
          </button>
        </div>
      )}
    </div>
  );
}

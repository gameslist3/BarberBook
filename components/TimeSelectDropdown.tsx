"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

interface TimeSelectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Generate 30-min time slots from 12:00 AM to 11:30 PM
function generateTimeSlots(): { label: string; isPM: boolean }[] {
  const slots: { label: string; isPM: boolean }[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (const minute of [0, 30]) {
      const isPM = hour >= 12;
      const displayHour = hour % 12 || 12;
      const displayMinute = minute === 0 ? "00" : "30";
      const ampm = isPM ? "PM" : "AM";
      slots.push({ label: `${displayHour}:${displayMinute} ${ampm}`, isPM });
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();
const PM_START_INDEX = TIME_SLOTS.findIndex((s) => s.isPM);

export function TimeSelectDropdown({ value, onChange, placeholder = "Select time" }: TimeSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate best position for the panel (above or below the button)
  const calcPosition = useCallback(() => {
    if (!btnRef.current) return null;
    const rect = btnRef.current.getBoundingClientRect();
    const panelWidth = Math.max(rect.width, 240);
    // Horizontal: prevent going off-screen
    const left = Math.min(Math.max(rect.left, 8), window.innerWidth - panelWidth - 8);
    // Vertical: flip above if not enough space below
    const estimatedHeight = 280;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    let top: number;
    if (spaceBelow >= estimatedHeight + 8) {
      top = rect.bottom + 6;
    } else if (spaceAbove >= estimatedHeight + 8) {
      top = rect.top - estimatedHeight - 6;
    } else {
      top = rect.bottom + 6;
    }
    return { top, left, width: panelWidth };
  }, []);

  // Open the dropdown
  const open = useCallback(() => {
    const pos = calcPosition();
    if (pos) {
      setPosition(pos);
      setIsOpen(true);
    }
  }, [calcPosition]);

  // Close on outside click / resize / scroll
  useEffect(() => {
    if (!isOpen) return;

    const close = () => setIsOpen(false);
    const clickHandler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    const scrollHandler = () => {
      const pos = calcPosition();
      if (pos) setPosition(pos);
    };

    document.addEventListener("mousedown", clickHandler);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", scrollHandler, true);
    return () => {
      document.removeEventListener("mousedown", clickHandler);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", scrollHandler, true);
    };
  }, [isOpen, calcPosition]);

  // Scroll to selected item when opening
  useEffect(() => {
    if (isOpen && listRef.current && value) {
      const selectedIndex = TIME_SLOTS.findIndex((s) => s.label === value);
      if (selectedIndex >= 0) {
        const item = listRef.current.children[selectedIndex] as HTMLElement;
        if (item) {
          item.scrollIntoView({ block: "center", behavior: "smooth" });
        }
      }
    }
  }, [isOpen, value]);

  const handleSelect = (slot: string) => {
    onChange(slot);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : open())}
        className={`
          w-full h-11 px-3.5 rounded-xl border text-left text-sm flex items-center justify-between gap-2
          transition-all duration-150 outline-none cursor-pointer
          ${isOpen
            ? "border-violet-300 ring-2 ring-violet-100 bg-white"
            : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white"
          }
        `}
      >
        <span className={`truncate ${value ? "text-gray-900 font-medium" : "text-gray-400"}`}>
          {value || placeholder}
        </span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && position && mounted && createPortal(
        <div
          ref={panelRef}
          className="fixed z-[99999] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
          style={{ top: position.top, left: position.left, width: position.width }}
        >
          <div ref={listRef} className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
            {TIME_SLOTS.map((slot, idx) => {
              const showPMHeader = idx === PM_START_INDEX;
              const isSelected = slot.label === value;

              return (
                <div key={slot.label}>
                  {showPMHeader && (
                    <div className="flex items-center gap-2 px-4 py-1.5 mt-1">
                      <div className="h-px flex-1 bg-gray-100" />
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">PM</span>
                      <div className="h-px flex-1 bg-gray-100" />
                    </div>
                  )}
                  {idx === 0 && (
                    <div className="flex items-center gap-2 px-4 py-1.5">
                      <div className="h-px flex-1 bg-gray-100" />
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">AM</span>
                      <div className="h-px flex-1 bg-gray-100" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSelect(slot.label)}
                    className={`
                      w-full text-left px-4 py-2.5 text-sm flex items-center justify-between
                      transition-colors relative cursor-pointer
                      ${isSelected
                        ? "text-violet-700 font-semibold bg-violet-50"
                        : "text-gray-700 hover:bg-gray-50"
                      }
                    `}
                  >
                    <span>{slot.label}</span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

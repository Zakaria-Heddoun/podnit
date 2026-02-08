"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface DatePickerCalendarProps {
  value: string;
  onChange: (date: string) => void;
  maxDate?: string;
}

export const DatePickerCalendar: React.FC<DatePickerCalendarProps> = ({
  value,
  onChange,
  maxDate = new Date().toISOString().split('T')[0],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, (m || 1) - 1, 1);
  });
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [popupPos, setPopupPos] = useState<{ top: number; left: number } | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const [y, m, d] = value.split('-').map(Number);
    if (!isNaN(y) && !isNaN(m)) setCurrentMonth(new Date(y, m - 1, 1));
  }, [value]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const formatLocalISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const handleDayClick = (day: number) => {
    const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateString = formatLocalISO(selected);
    onChange(dateString);
    setIsOpen(false);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const displayDate = (() => {
    try {
      const [yy, mm, dd] = value.split('-').map(Number);
      const d = new Date(yy, (mm || 1) - 1, dd || 1);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return value; }
  })();

  const selectedDate = value;

  // compute popup position when opening
  // compute popup position when opening and keep it inside the viewport
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const computePos = () => {
      const rect = buttonRef.current!.getBoundingClientRect();
      const popupW = popupRef.current?.offsetWidth ?? 280;
      const popupH = popupRef.current?.offsetHeight ?? 320;
      let left = rect.left;
      let top = rect.bottom + 8; // prefer below

      // clamp horizontally
      const margin = 8;
      if (left + popupW > window.innerWidth - margin) {
        left = Math.max(margin, window.innerWidth - popupW - margin);
      }
      if (left < margin) left = margin;

      // if not enough space below, open above
      if (top + popupH > window.innerHeight - margin) {
        top = rect.top - popupH - 8;
        if (top < margin) top = margin;
      }

      setPopupPos({ left, top });
    };

    // compute initially after a tick so popupRef can measure
    computePos();

    const onScroll = () => computePos();
    window.addEventListener('resize', onScroll);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [isOpen]);

  // close on outside click or Esc
  const handleDocumentClick = useCallback((e: MouseEvent) => {
    if (!isOpen) return;
    const target = e.target as Node;
    if (buttonRef.current && buttonRef.current.contains(target)) return;
    if (popupRef.current && popupRef.current.contains(target)) return;
    setIsOpen(false);
  }, [isOpen]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') setIsOpen(false); };
    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [handleDocumentClick]);

  const popup = (
    <div
      ref={popupRef}
      style={{ position: 'fixed', left: popupPos?.left ?? 0, top: popupPos?.top ?? 0, zIndex: 9999 }}
      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-3 w-64 max-w-[320px]"
    >
      <div className="flex items-center justify-between mb-3">
        <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition" type="button">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-xs font-semibold text-gray-800 dark:text-white">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition" type="button">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 h-7 flex items-center justify-center">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const isSelected = day && selectedDate === `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = day && new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();

          return (
            <button
              key={idx}
              onClick={() => day && handleDayClick(day)}
              disabled={!day}
              type="button"
              className={`h-7 text-xs rounded text-center transition ${
                !day
                  ? 'text-gray-300 dark:text-gray-600'
                  : isSelected
                  ? 'bg-blue-500 text-white font-semibold'
                  : isToday
                  ? 'border border-blue-500 text-blue-500 dark:text-blue-400 font-semibold'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="relative inline-block w-full">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-left flex items-center justify-between hover:border-gray-400 dark:hover:border-gray-600 transition"
        type="button"
      >
        <span>{displayDate}</span>
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {isOpen && createPortal(popup, document.body)}
    </div>
  );
};

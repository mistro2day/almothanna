import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function DatePicker({ value, onChange, placeholder = 'اختر التاريخ', className = '' }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => value ? new Date(value) : new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Close calendar popover on outside clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value) {
      // Ensure we don't reset if date is invalid
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        setCurrentDate(parsed);
      }
    }
  }, [value]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Get day of week of the 1st of the month (0 = Sun, 1 = Mon...)
  const firstDayIndex = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDateSelect = (day: number) => {
    // Construct local date to avoid timezone shift
    const yearStr = String(year);
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayIndex }, (_, i) => i);

  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none text-right cursor-pointer hover:border-emerald-500/50 transition-colors shadow-sm"
      >
        <span className={value ? 'text-[var(--text-primary)] font-mono text-sm' : 'text-[var(--text-secondary)] opacity-60 text-sm'}>
          {value ? value : placeholder}
        </span>
        <CalendarIcon className="w-4 h-4 text-[var(--text-secondary)]" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-72 rounded-2xl glass-card border border-[var(--glass-border)] bg-[var(--bg-secondary)] p-4 shadow-xl animate-fade-in-slide left-0 md:left-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4" dir="ltr">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-[var(--border-color)] text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4.5 h-4.5" />
            </button>
            <div className="font-bold text-sm text-[var(--text-primary)] font-display">
              {monthNamesEn[month]} {year}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-[var(--border-color)] text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-[var(--text-secondary)] mb-2" dir="ltr">
            {daysOfWeek.map((day, index) => (
              <div key={index} className="py-1">{day}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center" dir="ltr">
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="py-1.5"></div>
            ))}
            {daysArray.map((day) => {
              const yearStr = String(year);
              const monthStr = String(month + 1).padStart(2, '0');
              const dayStr = String(day).padStart(2, '0');
              const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
              const isSelected = value === dateStr;
              
              const todayStr = new Date().toISOString().split('T')[0];
              const isToday = todayStr === dateStr;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  className={`py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                      : isToday
                      ? 'bg-emerald-500/10 text-emerald-500 font-extrabold border border-emerald-500/30 animate-pulse'
                      : 'hover:bg-[var(--border-color)] text-[var(--text-primary)]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

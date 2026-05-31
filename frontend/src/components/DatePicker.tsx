import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function DatePicker({ value, onChange, placeholder = 'YYYY-MM-DD', className = '' }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => value ? new Date(value) : new Date());
  const [inputValue, setInputValue] = useState(value || '');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 288 });

  // Sync state with value prop
  useEffect(() => {
    setInputValue(value || '');
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        setCurrentDate(parsed);
      }
    }
  }, [value]);

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const popoverWidth = 300; // Fixed width of our calendar popup
      
      // Calculate best left position to align inside viewport
      let left = rect.left + window.scrollX;
      if (left + popoverWidth > window.innerWidth) {
        left = Math.max(10, window.innerWidth - popoverWidth - 20);
      }

      setCoords({
        top: rect.bottom + window.scrollY + 6,
        left: left,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen]);

  // Close calendar popover on outside clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDateSelect = (day: number) => {
    const yearStr = String(year);
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
    onChange(dateStr);
    setInputValue(dateStr);
    setIsOpen(false);
  };

  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    
    // Check if it matches YYYY-MM-DD pattern
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (regex.test(val)) {
      const parsed = new Date(val);
      if (!isNaN(parsed.getTime())) {
        onChange(val);
        setCurrentDate(parsed);
      }
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = Number(e.target.value);
    setCurrentDate(new Date(newYear, month, 1));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = Number(e.target.value);
    setCurrentDate(new Date(year, newMonth, 1));
  };

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayIndex }, (_, i) => i);

  const monthNamesAr = [
    'يناير (01)', 'فبراير (02)', 'مارس (03)', 'أبريل (04)', 'مايو (05)', 'يونيو (06)',
    'يوليو (07)', 'أغسطس (08)', 'سبتمبر (09)', 'أكتوبر (10)', 'نوفمبر (11)', 'ديسمبر (12)'
  ];

  const daysOfWeek = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

  const yearsRange = Array.from({ length: 41 }, (_, i) => 2010 + i); // 2010 to 2050

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {/* Input wrapper with premium style */}
      <div className="relative w-full flex items-center">
        <input
          type="text"
          value={inputValue}
          onChange={handleManualInputChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-teal-500 font-mono text-sm text-right transition-colors"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute left-3 p-1 text-[var(--text-secondary)] hover:text-teal-500 transition-colors cursor-pointer"
        >
          <CalendarIcon className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Popover rendered via React Portal in document.body to prevent clipping by overflow: hidden */}
      {isOpen && createPortal(
        <div 
          ref={popoverRef}
          className="fixed z-9999 w-[300px] rounded-2xl glass-card border border-[var(--glass-border)] bg-[var(--bg-secondary)] p-4 shadow-2xl animate-fade-in text-right"
          style={{
            top: `${coords.top}px`,
            left: `${coords.left}px`,
          }}
          dir="rtl"
        >
          {/* Header with Quick Dropdowns */}
          <div className="flex items-center justify-between gap-1 mb-4" dir="rtl">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-[var(--border-color)] text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4.5 h-4.5" />
            </button>

            {/* Quick selectors for Month and Year */}
            <div className="flex gap-1.5 items-center">
              <select
                value={month}
                onChange={handleMonthChange}
                className="bg-transparent border border-[var(--border-color)] rounded-lg px-1.5 py-1 text-xs font-bold text-[var(--text-primary)] outline-none cursor-pointer bg-[var(--bg-secondary)]"
              >
                {monthNamesAr.map((name, idx) => (
                  <option key={idx} value={idx} className="bg-[var(--bg-secondary)]">{name}</option>
                ))}
              </select>

              <select
                value={year}
                onChange={handleYearChange}
                className="bg-transparent border border-[var(--border-color)] rounded-lg px-1.5 py-1 text-xs font-bold text-[var(--text-primary)] outline-none cursor-pointer bg-[var(--bg-secondary)]"
              >
                {yearsRange.map((yr) => (
                  <option key={yr} value={yr} className="bg-[var(--bg-secondary)]">{yr}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-[var(--border-color)] text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[var(--text-secondary)] mb-2" dir="rtl">
            {daysOfWeek.map((day, index) => (
              <div key={index} className="py-1">{day}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center" dir="rtl">
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
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                      : isToday
                      ? 'bg-teal-500/10 text-teal-500 font-extrabold border border-teal-500/30'
                      : 'hover:bg-[var(--border-color)] text-[var(--text-primary)]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

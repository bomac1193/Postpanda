import { useState, useEffect, useMemo } from 'react';
import DroppableCalendarCell from '../components/calendar/DroppableCalendarCell';
import ScheduleTimePicker from '../components/calendar/ScheduleTimePicker';
import '../components/calendar/calendar.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function Calendar({ scheduledContent, onSchedule, onRemoveSchedule, draggedContent }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [contentToSchedule, setContentToSchedule] = useState(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDay = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({ date, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }

    // Next month days to fill the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false });
    }

    return days;
  }, [currentDate]);

  const getScheduledItemsForDate = (date) => {
    if (!scheduledContent) return [];

    const dateStr = date.toISOString().split('T')[0];
    return scheduledContent.filter(item => {
      if (!item.scheduledTime) return false;
      const itemDate = new Date(item.scheduledTime).toISOString().split('T')[0];
      return itemDate === dateStr;
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDrop = ({ contentId, contentData, date }) => {
    setSelectedDate(date);
    setContentToSchedule(contentData || { id: contentId });
    setShowTimePicker(true);
  };

  const handleScheduleSubmit = (scheduleData) => {
    if (onSchedule) {
      onSchedule({
        ...scheduleData,
        content: contentToSchedule,
      });
    }
    setShowTimePicker(false);
    setSelectedDate(null);
    setContentToSchedule(null);
  };

  const handleItemClick = (item) => {
    // Could open a detail modal or edit panel
    console.log('Clicked item:', item);
  };

  const handleRemoveItem = (item) => {
    if (onRemoveSchedule) {
      onRemoveSchedule(item);
    }
  };

  const monthYearLabel = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const isToday = (date) => {
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h3 className="calendar-title">{monthYearLabel}</h3>
        <div className="calendar-nav">
          <button
            type="button"
            className="calendar-nav-btn"
            onClick={handlePrevMonth}
            aria-label="Previous month"
          >
            &lt;
          </button>
          <button
            type="button"
            className="calendar-nav-btn"
            onClick={handleToday}
            aria-label="Go to today"
          >
            Today
          </button>
          <button
            type="button"
            className="calendar-nav-btn"
            onClick={handleNextMonth}
            aria-label="Next month"
          >
            &gt;
          </button>
        </div>
      </div>

      <div className="calendar-weekdays">
        {WEEKDAYS.map((day) => (
          <div key={day} className="calendar-weekday">{day}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {calendarDays.map(({ date, isCurrentMonth }, index) => (
          <DroppableCalendarCell
            key={index}
            date={date}
            scheduledItems={getScheduledItemsForDate(date)}
            isToday={isToday(date)}
            isCurrentMonth={isCurrentMonth}
            onDrop={handleDrop}
            onItemClick={handleItemClick}
            onRemoveItem={handleRemoveItem}
          />
        ))}
      </div>

      <ScheduleTimePicker
        isOpen={showTimePicker}
        date={selectedDate}
        content={contentToSchedule}
        onSchedule={handleScheduleSubmit}
        onClose={() => {
          setShowTimePicker(false);
          setSelectedDate(null);
          setContentToSchedule(null);
        }}
      />
    </div>
  );
}

export default Calendar;

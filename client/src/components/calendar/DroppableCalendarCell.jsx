import { useState } from 'react';
import PropTypes from 'prop-types';
import './calendar.css';

function DroppableCalendarCell({
  date,
  scheduledItems,
  isToday,
  isCurrentMonth,
  onDrop,
  onItemClick,
  onRemoveItem,
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const contentId = e.dataTransfer.getData('contentId');
    const contentData = e.dataTransfer.getData('contentData');

    if (contentId || contentData) {
      onDrop({
        contentId,
        contentData: contentData ? JSON.parse(contentData) : null,
        date,
      });
    }
  };

  const dayNumber = date.getDate();

  return (
    <div
      className={`calendar-cell ${isDragOver ? 'drag-over' : ''} ${isToday ? 'today' : ''} ${!isCurrentMonth ? 'other-month' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="calendar-cell-header">
        <span className="calendar-day-number">{dayNumber}</span>
        {isToday && <span className="calendar-today-badge">Today</span>}
      </div>

      <div className="calendar-cell-content">
        {scheduledItems.map((item) => (
          <div
            key={item.id || item._id}
            className={`calendar-scheduled-item ${item.status || 'scheduled'}`}
            onClick={() => onItemClick?.(item)}
          >
            {item.image || item.mediaUrl ? (
              <img
                src={item.image || item.mediaUrl}
                alt=""
                className="calendar-item-thumb"
              />
            ) : (
              <div
                className="calendar-item-color"
                style={{ backgroundColor: item.color || '#e8e2d9' }}
              />
            )}
            <div className="calendar-item-info">
              <span className="calendar-item-time">
                {item.scheduledTime ? new Date(item.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No time set'}
              </span>
              <span className="calendar-item-platform">{item.platform || 'All'}</span>
            </div>
            <button
              type="button"
              className="calendar-item-remove"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveItem?.(item);
              }}
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      {scheduledItems.length === 0 && isDragOver && (
        <div className="calendar-drop-hint">
          Drop here to schedule
        </div>
      )}
    </div>
  );
}

DroppableCalendarCell.propTypes = {
  date: PropTypes.instanceOf(Date).isRequired,
  scheduledItems: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    _id: PropTypes.string,
    image: PropTypes.string,
    mediaUrl: PropTypes.string,
    color: PropTypes.string,
    scheduledTime: PropTypes.string,
    platform: PropTypes.string,
    status: PropTypes.string,
  })),
  isToday: PropTypes.bool,
  isCurrentMonth: PropTypes.bool,
  onDrop: PropTypes.func.isRequired,
  onItemClick: PropTypes.func,
  onRemoveItem: PropTypes.func,
};

DroppableCalendarCell.defaultProps = {
  scheduledItems: [],
  isToday: false,
  isCurrentMonth: true,
  onItemClick: null,
  onRemoveItem: null,
};

export default DroppableCalendarCell;

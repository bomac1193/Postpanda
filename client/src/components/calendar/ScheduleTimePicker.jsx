import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './calendar.css';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'twitter', label: 'Twitter/X' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'pinterest', label: 'Pinterest' },
];

const PRESET_TIMES = [
  { label: '9:00 AM', hour: 9, minute: 0 },
  { label: '12:00 PM', hour: 12, minute: 0 },
  { label: '3:00 PM', hour: 15, minute: 0 },
  { label: '6:00 PM', hour: 18, minute: 0 },
  { label: '9:00 PM', hour: 21, minute: 0 },
];

function ScheduleTimePicker({ isOpen, date, content, onSchedule, onClose, suggestedTimes }) {
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [autoPost, setAutoPost] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedHour(12);
      setSelectedMinute(0);
      setAutoPost(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePresetClick = (hour, minute) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
  };

  const handleSubmit = () => {
    const scheduledTime = new Date(date);
    scheduledTime.setHours(selectedHour, selectedMinute, 0, 0);

    onSchedule({
      contentId: content?.id || content?._id,
      scheduledTime: scheduledTime.toISOString(),
      platform: selectedPlatform,
      autoPost,
    });
  };

  const formattedDate = date?.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="schedule-picker-overlay" onClick={onClose}>
      <div className="schedule-picker" onClick={(e) => e.stopPropagation()}>
        <div className="schedule-picker-header">
          <h4>Schedule Post</h4>
          <button type="button" className="schedule-picker-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="schedule-picker-body">
          <div className="schedule-picker-date">
            <span className="schedule-picker-label">Date</span>
            <span className="schedule-picker-value">{formattedDate}</span>
          </div>

          {content && (
            <div className="schedule-picker-preview">
              {(content.image || content.mediaUrl) && (
                <img
                  src={content.image || content.mediaUrl}
                  alt=""
                  className="schedule-picker-thumb"
                />
              )}
              <span className="schedule-picker-caption">
                {content.caption || 'No caption'}
              </span>
            </div>
          )}

          <div className="schedule-picker-section">
            <span className="schedule-picker-label">Quick Select</span>
            <div className="schedule-preset-times">
              {PRESET_TIMES.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className={`schedule-preset-btn ${selectedHour === preset.hour && selectedMinute === preset.minute ? 'active' : ''}`}
                  onClick={() => handlePresetClick(preset.hour, preset.minute)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {suggestedTimes && suggestedTimes.length > 0 && (
            <div className="schedule-picker-section">
              <span className="schedule-picker-label">AI Suggested Times</span>
              <div className="schedule-suggested-times">
                {suggestedTimes.map((time, index) => (
                  <button
                    key={index}
                    type="button"
                    className="schedule-suggested-btn"
                    onClick={() => handlePresetClick(time.hour, time.minute)}
                  >
                    {time.label}
                    <span className="schedule-suggested-score">{time.score}% engagement</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="schedule-picker-section">
            <span className="schedule-picker-label">Custom Time</span>
            <div className="schedule-time-inputs">
              <select
                value={selectedHour}
                onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                className="schedule-time-select"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i === 0 ? '12' : i > 12 ? i - 12 : i}
                  </option>
                ))}
              </select>
              <span className="schedule-time-separator">:</span>
              <select
                value={selectedMinute}
                onChange={(e) => setSelectedMinute(parseInt(e.target.value))}
                className="schedule-time-select"
              >
                {[0, 15, 30, 45].map((m) => (
                  <option key={m} value={m}>
                    {m.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
              <select
                value={selectedHour >= 12 ? 'PM' : 'AM'}
                onChange={(e) => {
                  const isPM = e.target.value === 'PM';
                  if (isPM && selectedHour < 12) {
                    setSelectedHour(selectedHour + 12);
                  } else if (!isPM && selectedHour >= 12) {
                    setSelectedHour(selectedHour - 12);
                  }
                }}
                className="schedule-time-select"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          <div className="schedule-picker-section">
            <span className="schedule-picker-label">Platform</span>
            <div className="schedule-platform-options">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform.id}
                  type="button"
                  className={`schedule-platform-btn ${selectedPlatform === platform.id ? 'active' : ''}`}
                  onClick={() => setSelectedPlatform(platform.id)}
                >
                  {platform.label}
                </button>
              ))}
            </div>
          </div>

          <div className="schedule-picker-section">
            <label className="schedule-auto-post">
              <input
                type="checkbox"
                checked={autoPost}
                onChange={(e) => setAutoPost(e.target.checked)}
              />
              <span>Auto-post at scheduled time</span>
            </label>
          </div>
        </div>

        <div className="schedule-picker-footer">
          <button
            type="button"
            className="schedule-cancel-btn ghost"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="schedule-submit-btn primary"
            onClick={handleSubmit}
          >
            Schedule Post
          </button>
        </div>
      </div>
    </div>
  );
}

ScheduleTimePicker.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  date: PropTypes.instanceOf(Date),
  content: PropTypes.shape({
    id: PropTypes.string,
    _id: PropTypes.string,
    image: PropTypes.string,
    mediaUrl: PropTypes.string,
    caption: PropTypes.string,
  }),
  onSchedule: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  suggestedTimes: PropTypes.arrayOf(PropTypes.shape({
    hour: PropTypes.number,
    minute: PropTypes.number,
    label: PropTypes.string,
    score: PropTypes.number,
  })),
};

ScheduleTimePicker.defaultProps = {
  date: null,
  content: null,
  suggestedTimes: null,
};

export default ScheduleTimePicker;

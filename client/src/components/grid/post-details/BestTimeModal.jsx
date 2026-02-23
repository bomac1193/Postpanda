import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { aiApi } from '../../../lib/api';

function BestTimeModal({ onClose }) {
  const [bestTimes, setBestTimes] = useState(null);
  const [loadingBestTimes, setLoadingBestTimes] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await aiApi.getOptimalTiming('instagram', 'image');
        if (!cancelled) setBestTimes(data);
      } catch (error) {
        console.error('Failed to get best times:', error);
        if (!cancelled) {
          setBestTimes({
            bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
            bestHours: ['9:00 AM', '12:00 PM', '7:00 PM'],
            recommendation: 'Based on general engagement patterns, posting on weekday mornings or evenings tends to perform best.',
          });
        }
      } finally {
        if (!cancelled) setLoadingBestTimes(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-2xl border border-dark-700 w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-dark-700">
          <h3 className="text-lg font-semibold text-dark-100">Best Time to Post</h3>
          <button onClick={onClose} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {loadingBestTimes ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-accent-purple" />
            </div>
          ) : bestTimes ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-dark-200 mb-2">Best Days</h4>
                <div className="flex flex-wrap gap-2">
                  {bestTimes.bestDays?.map((day) => (
                    <span key={day} className="px-3 py-1 bg-accent-purple/20 text-accent-purple rounded-lg text-sm">
                      {day}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-dark-200 mb-2">Best Times</h4>
                <div className="flex flex-wrap gap-2">
                  {bestTimes.bestHours?.map((time) => (
                    <span key={time} className="px-3 py-1 bg-accent-blue/20 text-accent-blue rounded-lg text-sm">
                      {time}
                    </span>
                  ))}
                </div>
              </div>

              {bestTimes.recommendation && (
                <div className="p-3 bg-dark-700 rounded-lg">
                  <p className="text-sm text-dark-300">{bestTimes.recommendation}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-dark-400 py-4">Unable to load best times</p>
          )}
        </div>

        <div className="p-4 border-t border-dark-700">
          <button onClick={onClose} className="w-full btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default BestTimeModal;

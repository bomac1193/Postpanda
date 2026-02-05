import { useState } from 'react';
import {
  ArrowUp,
  ArrowDown,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar
} from 'lucide-react';

function ValidationHistoryTable({ validations, onRefresh }) {
  const [sortBy, setSortBy] = useState('date'); // 'date', 'accuracy', 'predicted', 'actual'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [filterArchetype, setFilterArchetype] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get unique archetypes for filter
  const archetypes = ['all', ...new Set(validations.map(v => v.predicted?.archetypeMatch?.designation).filter(Boolean))];

  // Filter validations
  const filteredValidations = validations.filter(v => {
    if (filterArchetype === 'all') return true;
    return v.predicted?.archetypeMatch?.designation === filterArchetype;
  });

  // Sort validations
  const sortedValidations = [...filteredValidations].sort((a, b) => {
    let aVal, bVal;

    switch (sortBy) {
      case 'date':
        aVal = new Date(a.validatedAt || a.createdAt);
        bVal = new Date(b.validatedAt || b.createdAt);
        break;
      case 'accuracy':
        aVal = a.validation?.accuracy || 0;
        bVal = b.validation?.accuracy || 0;
        break;
      case 'predicted':
        aVal = a.predicted?.convictionScore || 0;
        bVal = b.predicted?.convictionScore || 0;
        break;
      case 'actual':
        aVal = a.actual?.engagementScore || 0;
        bVal = b.actual?.engagementScore || 0;
        break;
      default:
        aVal = 0;
        bVal = 0;
    }

    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  // Paginate
  const totalPages = Math.ceil(sortedValidations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedValidations = sortedValidations.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 80) return 'text-green-400';
    if (accuracy >= 60) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getAccuracyBadge = (accuracy) => {
    if (accuracy >= 80) return { icon: CheckCircle, color: 'bg-green-500/20 text-green-400 border-green-500/30' };
    if (accuracy >= 60) return { icon: TrendingUp, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    return { icon: AlertCircle, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
  };

  const getArchetypeGlyph = (archetype) => {
    const glyphs = {
      Architect: '🏛️',
      Maven: '💎',
      Maverick: '⚡',
      Artisan: '🎨',
      Sage: '🧙',
      Alchemist: '🔮',
      Titan: '⚔️',
      Muse: '🌙',
      Oracle: '👁️',
      Phoenix: '🔥'
    };
    return glyphs[archetype] || '📊';
  };

  if (validations.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400 mb-2">No validations yet</p>
        <p className="text-gray-500 text-sm">
          Validations will appear here once your scheduled posts have been published and performance data is collected.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <select
          value={filterArchetype}
          onChange={(e) => {
            setFilterArchetype(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-purple"
        >
          {archetypes.map(archetype => (
            <option key={archetype} value={archetype}>
              {archetype === 'all' ? 'All Archetypes' : `${getArchetypeGlyph(archetype)} ${archetype}`}
            </option>
          ))}
        </select>

        <div className="text-sm text-gray-400">
          Showing {paginatedValidations.length} of {filteredValidations.length} validations
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-700">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                <button
                  onClick={() => handleSort('date')}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  Date
                  {sortBy === 'date' && (
                    sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                Content
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                Archetype
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                <button
                  onClick={() => handleSort('predicted')}
                  className="flex items-center gap-1 hover:text-white transition-colors ml-auto"
                >
                  Predicted
                  {sortBy === 'predicted' && (
                    sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                <button
                  onClick={() => handleSort('actual')}
                  className="flex items-center gap-1 hover:text-white transition-colors ml-auto"
                >
                  Actual
                  {sortBy === 'actual' && (
                    sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">
                Delta
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                <button
                  onClick={() => handleSort('accuracy')}
                  className="flex items-center gap-1 hover:text-white transition-colors ml-auto"
                >
                  Accuracy
                  {sortBy === 'accuracy' && (
                    sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                  )}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedValidations.map((validation, index) => {
              const predicted = validation.predicted?.convictionScore || 0;
              const actual = validation.actual?.engagementScore || 0;
              const accuracy = validation.validation?.accuracy || 0;
              const delta = actual - predicted;
              const archetype = validation.predicted?.archetypeMatch?.designation;
              const badge = getAccuracyBadge(accuracy);

              return (
                <tr
                  key={validation._id || index}
                  className="border-b border-dark-700 hover:bg-dark-700/50 transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-gray-300">
                    {new Date(validation.validatedAt || validation.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {validation.content?.image && (
                        <img
                          src={validation.content.image}
                          alt=""
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <div className="text-sm text-gray-300 truncate max-w-xs">
                        {validation.content?.caption || 'No caption'}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {archetype && (
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getArchetypeGlyph(archetype)}</span>
                        <span className="text-gray-300">{archetype}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-sm font-semibold text-white">
                    {Math.round(predicted)}
                  </td>
                  <td className="py-3 px-4 text-right text-sm font-semibold text-white">
                    {Math.round(actual)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className={`flex items-center justify-center gap-1 text-sm font-semibold ${
                      delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {delta > 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : delta < 0 ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : null}
                      <span>{delta > 0 ? '+' : ''}{Math.round(delta)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className={`text-sm font-semibold ${getAccuracyColor(accuracy)}`}>
                        {Math.round(accuracy)}%
                      </span>
                      <badge.icon className={`w-4 h-4 ${badge.color.split(' ')[1]}`} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-dark-700 text-gray-300 rounded-lg hover:bg-dark-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-dark-700 text-gray-300 rounded-lg hover:bg-dark-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ValidationHistoryTable;

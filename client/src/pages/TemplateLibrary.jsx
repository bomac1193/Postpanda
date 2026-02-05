import { useState, useEffect } from 'react';
import {
  Sparkles,
  Download,
  Star,
  TrendingUp,
  Grid as GridIcon,
  Search,
  Filter,
  Eye,
  Lock,
  Unlock,
  DollarSign,
  BarChart3,
  Loader2,
  Zap,
  Heart,
  ChevronDown,
  Check,
  X
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { templateApi } from '../lib/api';
import { ConvictionBadge } from '../components/conviction';

const ARCHETYPE_GLYPHS = {
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

function TemplateLibrary() {
  const { user } = useAppStore();
  const [templates, setTemplates] = useState([]);
  const [myTemplates, setMyTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeTab, setActiveTab] = useState('library'); // 'library' | 'my-templates'
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    minConvictionScore: 0,
    archetype: 'all',
    priceRange: 'all', // 'free' | 'paid' | 'all'
    sortBy: 'popular' // 'popular' | 'recent' | 'highest-rated' | 'highest-conviction'
  });
  const [applyMode, setApplyMode] = useState(false);
  const [selectedContent, setSelectedContent] = useState([]);

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, [filters, activeTab]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);

      if (activeTab === 'library') {
        const data = await templateApi.getPublicLibrary(filters);
        setTemplates(data);
      } else {
        const data = await templateApi.getMyTemplates(filters);
        setMyTemplates(data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = async (templateId) => {
    if (!selectedContent.length) {
      alert('Please select content to fill the template');
      return;
    }

    try {
      const result = await templateApi.applyTemplate(templateId, selectedContent);
      alert(`Template applied! Grid score: ${Math.round(result.grid.aestheticScore)}/100`);
      setApplyMode(false);
      setSelectedContent([]);
    } catch (error) {
      console.error('Failed to apply template:', error);
      alert('Failed to apply template: ' + error.message);
    }
  };

  const handleRateTemplate = async (templateId, rating) => {
    try {
      await templateApi.rate(templateId, rating);
      fetchTemplates(); // Refresh to show updated rating
    } catch (error) {
      console.error('Failed to rate template:', error);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Delete this template? This cannot be undone.')) return;

    try {
      await templateApi.delete(templateId);
      fetchTemplates(); // Refresh list
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template: ' + error.message);
    }
  };

  const filteredTemplates = (activeTab === 'library' ? templates : myTemplates).filter(t => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!t.name.toLowerCase().includes(query) &&
          !t.description?.toLowerCase().includes(query)) {
        return false;
      }
    }
    return true;
  });

  const getArchetypeDistribution = (template) => {
    if (!template.metrics?.archetypeDistribution) return [];

    return Object.entries(template.metrics.archetypeDistribution)
      .map(([archetype, count]) => ({ archetype, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-accent-purple" />
              Designer Vault
            </h1>
            <p className="text-gray-400 mt-2">
              High-conviction grid templates from top creators
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('library')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'library'
                  ? 'bg-accent-purple text-white'
                  : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
              }`}
            >
              <GridIcon className="w-4 h-4 inline mr-2" />
              Public Library
            </button>
            <button
              onClick={() => setActiveTab('my-templates')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'my-templates'
                  ? 'bg-accent-purple text-white'
                  : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
              }`}
            >
              <Heart className="w-4 h-4 inline mr-2" />
              My Templates
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent-purple"
            />
          </div>

          {/* Sort By */}
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
            className="bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-purple"
          >
            <option value="popular">Most Popular</option>
            <option value="recent">Most Recent</option>
            <option value="highest-rated">Highest Rated</option>
            <option value="highest-conviction">Highest Conviction</option>
          </select>

          {/* Price Filter */}
          <select
            value={filters.priceRange}
            onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
            className="bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-purple"
          >
            <option value="all">All Templates</option>
            <option value="free">Free Only</option>
            <option value="paid">Premium</option>
          </select>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <GridIcon className="w-4 h-4" />
              Total Templates
            </div>
            <div className="text-2xl font-bold">{filteredTemplates.length}</div>
          </div>

          <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Zap className="w-4 h-4 text-green-400" />
              Avg Conviction
            </div>
            <div className="text-2xl font-bold text-green-400">
              {filteredTemplates.length > 0
                ? Math.round(
                    filteredTemplates.reduce((sum, t) => sum + (t.metrics?.avgConvictionScore || 0), 0) /
                    filteredTemplates.length
                  )
                : 0}
            </div>
          </div>

          <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Star className="w-4 h-4 text-yellow-400" />
              Avg Rating
            </div>
            <div className="text-2xl font-bold text-yellow-400">
              {filteredTemplates.length > 0
                ? (
                    filteredTemplates.reduce((sum, t) => sum + (t.metrics?.avgRating || 0), 0) /
                    filteredTemplates.length
                  ).toFixed(1)
                : '0.0'}
            </div>
          </div>

          <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Download className="w-4 h-4 text-accent-purple" />
              Total Uses
            </div>
            <div className="text-2xl font-bold text-accent-purple">
              {filteredTemplates.reduce((sum, t) => sum + (t.metrics?.timesUsed || 0), 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Template Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-accent-purple" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-20">
            <GridIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              No templates found
            </h3>
            <p className="text-gray-500">
              {activeTab === 'my-templates'
                ? 'Create your first template from a high-conviction grid'
                : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template._id}
                template={template}
                onApply={handleApplyTemplate}
                onRate={handleRateTemplate}
                onDelete={activeTab === 'my-templates' ? handleDeleteTemplate : null}
                isOwner={activeTab === 'my-templates'}
              />
            ))}
          </div>
        )}
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <TemplateDetailModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onApply={handleApplyTemplate}
          onRate={handleRateTemplate}
        />
      )}
    </div>
  );
}

// Template Card Component
function TemplateCard({ template, onApply, onRate, onDelete, isOwner }) {
  const [showActions, setShowActions] = useState(false);

  const archetypes = template.metrics?.archetypeDistribution
    ? Object.entries(template.metrics.archetypeDistribution)
        .map(([archetype, count]) => ({ archetype, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
    : [];

  return (
    <div
      className="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden hover:border-accent-purple transition-all group cursor-pointer"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Preview */}
      <div className="aspect-square bg-dark-900 relative overflow-hidden">
        {/* Grid Preview (placeholder - would render actual grid) */}
        <div className="grid grid-cols-3 gap-1 p-4 h-full">
          {Array.from({ length: template.layout?.rows * template.layout?.columns || 9 }).map((_, i) => (
            <div
              key={i}
              className="bg-dark-700 rounded-sm flex items-center justify-center text-2xl"
            >
              {template.slots?.[i]?.archetypePreference
                ? ARCHETYPE_GLYPHS[template.slots[i].archetypePreference] || '📷'
                : '📷'}
            </div>
          ))}
        </div>

        {/* Conviction Badge */}
        <div className="absolute top-2 right-2">
          <ConvictionBadge
            score={template.metrics?.avgConvictionScore || 0}
            size="sm"
          />
        </div>

        {/* Hover Actions */}
        {showActions && (
          <div className="absolute inset-0 bg-dark-900/90 flex items-center justify-center gap-2 transition-opacity">
            <button
              onClick={() => onApply(template._id)}
              className="px-4 py-2 bg-accent-purple hover:bg-accent-purple-dark rounded-lg flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Apply
            </button>
            {isOwner && onDelete && (
              <button
                onClick={() => onDelete(template._id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 transition-colors"
              >
                <X className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg">{template.name}</h3>
          {template.marketplace?.forSale && (
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <DollarSign className="w-4 h-4" />
              {template.marketplace.price || 0}
            </div>
          )}
        </div>

        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
          {template.description || 'No description'}
        </p>

        {/* Archetype Tags */}
        {archetypes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {archetypes.map(({ archetype, count }) => (
              <span
                key={archetype}
                className="px-2 py-1 bg-dark-700 rounded text-xs text-gray-300"
              >
                {ARCHETYPE_GLYPHS[archetype] || '📷'} {archetype} ({count})
              </span>
            ))}
          </div>
        )}

        {/* Metrics */}
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400" />
              {template.metrics?.avgRating?.toFixed(1) || '0.0'}
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              {template.metrics?.timesUsed || 0}
            </span>
          </div>

          <div className="flex items-center gap-1 text-accent-purple">
            <BarChart3 className="w-4 h-4" />
            {Math.round(template.metrics?.aestheticScore || 0)}/100
          </div>
        </div>
      </div>
    </div>
  );
}

// Template Detail Modal (simplified - would expand for full detail view)
function TemplateDetailModal({ template, onClose, onApply, onRate }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
      <div className="bg-dark-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal content would go here */}
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">{template.name}</h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
          {/* Add full template details, preview, ratings, etc. */}
        </div>
      </div>
    </div>
  );
}

export default TemplateLibrary;

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, TrendingUp, Zap, Clock, Target, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { rolloutApi } from '../../lib/api';

/**
 * BLUE OCEAN: Rollout Intelligence Panel
 *
 * Displays AI-powered insights:
 * - Conviction-based phase gating
 * - Archetype-specific pacing recommendations
 * - Stan velocity prediction
 */
export default function RolloutIntelligencePanel({ rolloutId, rollout }) {
  const [intelligence, setIntelligence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (!rolloutId) return;
    loadIntelligence();
  }, [rolloutId]);

  const loadIntelligence = async () => {
    try {
      setLoading(true);
      const data = await rolloutApi.getIntelligence(rolloutId);
      setIntelligence(data.intelligence);
      setError(null);
    } catch (err) {
      console.error('Failed to load intelligence:', err);
      setError('Failed to load intelligence');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
          <span className="text-dark-400">Analyzing rollout intelligence...</span>
        </div>
      </div>
    );
  }

  if (error || !intelligence) {
    return null;
  }

  const { overallReadiness, pacing, velocity, sections } = intelligence;

  // Calculate severity for warnings
  const highWarnings = pacing.warnings.filter(w => w.severity === 'HIGH').length;
  const mediumWarnings = pacing.warnings.filter(w => w.severity === 'MEDIUM').length;

  const allReady = overallReadiness.ready;

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-dark-750 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-accent-purple" />
          <div className="text-left">
            <h3 className="font-semibold text-white">Rollout Intelligence</h3>
            <p className="text-sm text-dark-400">AI-powered insights for {pacing.label} archetype</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status badges */}
          {allReady ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm">
              <CheckCircle className="w-4 h-4" />
              Ready to Launch
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/20 text-orange-400 rounded-lg text-sm">
              <AlertTriangle className="w-4 h-4" />
              {overallReadiness.readySections}/{overallReadiness.totalSections} Sections Ready
            </span>
          )}

          {highWarnings > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
              {highWarnings} critical
            </span>
          )}

          {expanded ? (
            <ChevronUp className="w-5 h-5 text-dark-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-dark-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-6 py-4 space-y-6 border-t border-dark-700">
          {/* Overall Readiness */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-accent-purple" />
              Overall Readiness
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                label="Sections Ready"
                value={`${overallReadiness.readySections}/${overallReadiness.totalSections}`}
                color={allReady ? 'green' : 'orange'}
              />
              <StatCard
                label="Total Pieces"
                value={overallReadiness.totalPieces}
                color="blue"
              />
              <StatCard
                label="Avg Conviction"
                value={overallReadiness.avgConviction}
                color={overallReadiness.avgConviction >= 70 ? 'green' : 'orange'}
              />
              <StatCard
                label="Archetype"
                value={pacing.archetype}
                color="purple"
              />
            </div>
          </div>

          {/* Pacing Analysis */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent-purple" />
              Pacing Analysis
            </h4>

            <div className="space-y-3">
              {/* Optimal vs Current */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-dark-750 rounded-lg p-3">
                  <div className="text-xs text-dark-400 mb-1">Current Cadence</div>
                  <div className="text-lg font-semibold text-white">
                    {pacing.current.cadenceDays} days
                  </div>
                </div>
                <div className="bg-accent-purple/10 border border-accent-purple/30 rounded-lg p-3">
                  <div className="text-xs text-accent-purple mb-1">Optimal Cadence</div>
                  <div className="text-lg font-semibold text-accent-purple">
                    {pacing.optimal.cadenceDays} days
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {pacing.warnings.length > 0 && (
                <div className="space-y-2">
                  {pacing.warnings.map((warning, idx) => (
                    <Warning key={idx} warning={warning} />
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {pacing.recommendations.length > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <div className="text-xs font-semibold text-blue-400 mb-2">
                    <Info className="w-3 h-3 inline mr-1" />
                    {pacing.label} Recommendations
                  </div>
                  <ul className="space-y-1">
                    {pacing.recommendations.slice(0, 3).map((rec, idx) => (
                      <li key={idx} className="text-sm text-blue-300">
                        • {rec.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Stan Velocity Prediction */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent-purple" />
              Stan Velocity Prediction
            </h4>

            <div className="space-y-3">
              {/* SCR Comparison */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-dark-750 rounded-lg p-3">
                  <div className="text-xs text-dark-400 mb-1">Current SCR</div>
                  <div className="text-2xl font-bold text-white">
                    {velocity.current.predictedSCR}
                  </div>
                  <div className="text-xs text-dark-400 mt-1">
                    {velocity.current.cadence}d cadence
                  </div>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <div className="text-xs text-green-400 mb-1">Optimal SCR</div>
                  <div className="text-2xl font-bold text-green-400">
                    {velocity.optimal.targetSCR}
                  </div>
                  <div className="text-xs text-green-400 mt-1">
                    +{velocity.optimal.improvement}% improvement
                  </div>
                </div>
              </div>

              {/* Conversion Timeline */}
              <div className="bg-dark-750 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-dark-400">Casual → Stan Timeline</span>
                  <span className="text-xs text-accent-purple font-semibold">
                    {velocity.conversionTimeline.velocity}
                  </span>
                </div>
                <div className="text-lg font-semibold text-white">
                  ~{velocity.conversionTimeline.casualToStan} days
                </div>
                <div className="text-xs text-dark-400 mt-1">
                  Momentum half-life: {velocity.conversionTimeline.momentumHalfLife} days
                </div>
              </div>

              {/* Reasoning */}
              {velocity.reasoning.length > 0 && (
                <div className="bg-dark-750 rounded-lg p-3">
                  <div className="text-xs font-semibold text-dark-400 mb-2">Why?</div>
                  <ul className="space-y-1">
                    {velocity.reasoning.slice(0, 3).map((reason, idx) => (
                      <li key={idx} className="text-sm text-dark-200">
                        • {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Velocity Recommendations */}
              {velocity.recommendations.length > 0 && (
                <div className="space-y-2">
                  {velocity.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg p-3 border ${
                        rec.priority === 'HIGH'
                          ? 'bg-orange-500/10 border-orange-500/30'
                          : 'bg-blue-500/10 border-blue-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-semibold ${
                            rec.priority === 'HIGH' ? 'text-orange-400' : 'text-blue-400'
                          }`}
                        >
                          {rec.type.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            rec.priority === 'HIGH'
                              ? 'bg-orange-500/20 text-orange-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}
                        >
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-sm text-white">{rec.message}</p>
                      {rec.impact && (
                        <p className="text-xs text-dark-400 mt-1">Impact: {rec.impact}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section Readiness Details */}
          {sections.some(s => !s.ready) && (
            <div>
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                Sections Blocked
              </h4>
              <div className="space-y-2">
                {sections.filter(s => !s.ready).map((section, idx) => (
                  <div key={idx} className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-orange-400">{section.sectionName}</span>
                      <span className="text-xs text-orange-400">
                        {section.stats.belowThreshold} blocked
                      </span>
                    </div>
                    <p className="text-sm text-white mb-2">{section.message}</p>
                    {section.suggestions.length > 0 && (
                      <ul className="space-y-1">
                        {section.suggestions.slice(0, 2).map((suggestion, sIdx) => (
                          <li key={sIdx} className="text-xs text-orange-300">
                            → {suggestion}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
    orange: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    purple: 'bg-accent-purple/10 border-accent-purple/30 text-accent-purple',
    red: 'bg-red-500/10 border-red-500/30 text-red-400'
  };

  return (
    <div className={`rounded-lg border p-3 ${colors[color]}`}>
      <div className="text-xs opacity-75 mb-1">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}

function Warning({ warning }) {
  const severityColors = {
    HIGH: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      badge: 'bg-red-500/20 text-red-400'
    },
    MEDIUM: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      text: 'text-orange-400',
      badge: 'bg-orange-500/20 text-orange-400'
    },
    LOW: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      badge: 'bg-yellow-500/20 text-yellow-400'
    },
    INFO: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      badge: 'bg-blue-500/20 text-blue-400'
    }
  };

  const style = severityColors[warning.severity] || severityColors.INFO;

  return (
    <div className={`rounded-lg border p-3 ${style.bg} ${style.border}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-semibold ${style.text}`}>
          {warning.type.replace(/_/g, ' ')}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded ${style.badge}`}>
          {warning.severity}
        </span>
      </div>
      <p className={`text-sm ${style.text} mb-1`}>{warning.message}</p>
      {warning.impact && (
        <p className="text-xs text-dark-400">Impact: {warning.impact}</p>
      )}
      {warning.suggestion && (
        <p className={`text-xs ${style.text} mt-2`}>
          → {warning.suggestion}
        </p>
      )}
      {warning.scrImpact && (
        <p className="text-xs text-dark-400 mt-1">SCR Impact: {warning.scrImpact}</p>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useRoundStore } from '../store';
import type { Weighing, WeighingDimensions } from '../types';
import { TYPE_COLORS } from '../types';

interface Props {
  onClose: () => void;
}

type Step = 'select-a' | 'select-b' | 'edit';

const DIMENSION_LABELS: { key: keyof WeighingDimensions; label: string }[] = [
  { key: 'magnitude', label: 'Magnitude' },
  { key: 'scope', label: 'Scope' },
  { key: 'probability', label: 'Probability' },
  { key: 'reversibility', label: 'Reversibility' },
  { key: 'timeframe', label: 'Timeframe' },
  { key: 'moralWeight', label: 'Moral Weight' },
];

export function WeighingOverlay({ onClose }: Props) {
  const nodes = useRoundStore((s) => s.nodes);
  const weighings = useRoundStore((s) => s.weighings);
  const addWeighing = useRoundStore((s) => s.addWeighing);
  const updateWeighing = useRoundStore((s) => s.updateWeighing);

  const [step, setStep] = useState<Step>('select-a');
  const [impactAId, setImpactAId] = useState<string | null>(null);
  const [activeWeighing, setActiveWeighing] = useState<Weighing | null>(null);
  const [selectedExisting, setSelectedExisting] = useState<string | null>(null);

  const getNodeLabel = (id: string) => {
    const node = nodes.find((n) => n.id === id);
    if (!node) return '?';
    const speakerNodes = nodes.filter((n) => n.speaker === node.speaker);
    const num = speakerNodes.indexOf(node) + 1;
    return `${node.speaker} #${num}: "${node.text.slice(0, 40)}${node.text.length > 40 ? '...' : ''}"`;
  };

  const handleSelectNode = (nodeId: string) => {
    if (step === 'select-a') {
      setImpactAId(nodeId);
      setStep('select-b');
    } else if (step === 'select-b' && impactAId) {
      const w = addWeighing(impactAId, nodeId);
      setActiveWeighing(w);
      setStep('edit');
    }
  };

  const handleDimensionChange = (key: keyof WeighingDimensions, value: string) => {
    if (!activeWeighing) return;
    const updated = {
      ...activeWeighing,
      dimensions: { ...activeWeighing.dimensions, [key]: value },
    };
    setActiveWeighing(updated);
    updateWeighing(activeWeighing.id, { dimensions: updated.dimensions });
  };

  const handleVerdictChange = (value: string) => {
    if (!activeWeighing) return;
    setActiveWeighing({ ...activeWeighing, verdict: value });
    updateWeighing(activeWeighing.id, { verdict: value });
  };

  const handleSelectExisting = (id: string) => {
    const w = weighings.find((w) => w.id === id);
    if (w) {
      setActiveWeighing(w);
      setSelectedExisting(id);
      setStep('edit');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]"
      onClick={onClose}
    >
      <div
        className="bg-bg-card border border-border-subtle rounded-lg p-5 max-w-2xl w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-bright font-sans text-base font-medium">Weighing Matrix</h2>
          <span className="text-text-muted text-xs font-mono">Esc to close</span>
        </div>

        {/* Existing weighings */}
        {weighings.length > 0 && step !== 'edit' && (
          <div className="mb-4">
            <h3 className="text-[10px] text-text-muted font-mono uppercase mb-2">Saved Weighings</h3>
            <div className="space-y-1">
              {weighings.map((w) => (
                <button
                  key={w.id}
                  className={`w-full text-left px-2 py-1.5 rounded text-[11px] ${
                    selectedExisting === w.id ? 'bg-bg-card-hover ring-1 ring-border-focus' : 'bg-bg-primary hover:bg-bg-card-hover'
                  }`}
                  onClick={() => handleSelectExisting(w.id)}
                >
                  <span className="text-text-secondary">{getNodeLabel(w.impactA)}</span>
                  <span className="text-text-muted mx-1">vs</span>
                  <span className="text-text-secondary">{getNodeLabel(w.impactB)}</span>
                </button>
              ))}
            </div>
            <div className="border-b border-border-subtle my-3" />
          </div>
        )}

        {/* Node selection */}
        {(step === 'select-a' || step === 'select-b') && (
          <div>
            <h3 className="text-[11px] text-text-secondary font-mono mb-2">
              {step === 'select-a' ? 'Select Impact A' : 'Select Impact B'}
              {step === 'select-b' && impactAId && (
                <span className="text-text-muted ml-2">(Impact A: {getNodeLabel(impactAId)})</span>
              )}
            </h3>
            <div className="space-y-1 max-h-[40vh] overflow-y-auto">
              {nodes.map((node) => (
                <button
                  key={node.id}
                  className="w-full text-left px-2 py-1.5 rounded text-[11px] bg-bg-primary hover:bg-bg-card-hover flex items-center gap-2"
                  onClick={() => handleSelectNode(node.id)}
                  disabled={node.id === impactAId}
                  style={{ opacity: node.id === impactAId ? 0.3 : 1 }}
                >
                  <span
                    className="text-[9px] font-mono font-bold px-1 rounded shrink-0"
                    style={{ color: node.type ? TYPE_COLORS[node.type] : '#666', backgroundColor: node.type ? `${TYPE_COLORS[node.type]}18` : '#66661a' }}
                  >
                    {node.speaker}
                  </span>
                  <span className="text-text-secondary truncate">{node.text}</span>
                </button>
              ))}
              {nodes.length === 0 && (
                <p className="text-[10px] text-text-muted italic text-center py-4">
                  No nodes yet. Add arguments first.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Weighing editor */}
        {step === 'edit' && activeWeighing && (
          <div>
            <div className="bg-bg-primary rounded px-3 py-2 mb-4">
              <div className="text-[11px] text-text-secondary mb-1">
                <span className="text-text-bright">{getNodeLabel(activeWeighing.impactA)}</span>
              </div>
              <div className="text-[10px] text-text-muted text-center my-1">vs</div>
              <div className="text-[11px] text-text-secondary">
                <span className="text-text-bright">{getNodeLabel(activeWeighing.impactB)}</span>
              </div>
            </div>

            <div className="space-y-2">
              {DIMENSION_LABELS.map(({ key, label }) => (
                <div key={key}>
                  <label className="text-[10px] text-text-muted font-mono uppercase block mb-0.5">
                    {label}
                  </label>
                  <textarea
                    className="w-full bg-bg-primary text-text-primary text-[11px] font-sans rounded px-2 py-1.5 outline-none resize-none border border-border-subtle focus:border-border-focus min-h-[36px]"
                    value={activeWeighing.dimensions[key]}
                    onChange={(e) => handleDimensionChange(key, e.target.value)}
                    rows={1}
                  />
                </div>
              ))}

              <div className="border-t border-border-subtle pt-2 mt-3">
                <label className="text-[10px] text-must-respond font-mono uppercase block mb-0.5">
                  Bottom Line
                </label>
                <textarea
                  className="w-full bg-bg-primary text-text-primary text-[11px] font-sans rounded px-2 py-1.5 outline-none resize-none border border-border-subtle focus:border-border-focus min-h-[48px]"
                  value={activeWeighing.verdict}
                  onChange={(e) => handleVerdictChange(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <button
                className="text-[10px] text-text-muted font-mono hover:text-text-secondary"
                onClick={() => {
                  setStep('select-a');
                  setImpactAId(null);
                  setActiveWeighing(null);
                  setSelectedExisting(null);
                }}
              >
                + New Weighing
              </button>
              <button
                className="text-[10px] text-text-bright font-mono px-3 py-1 rounded bg-bg-primary hover:bg-bg-card-hover border border-border-subtle"
                onClick={onClose}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

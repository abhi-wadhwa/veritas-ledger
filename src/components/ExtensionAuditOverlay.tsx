import { useRoundStore } from '../store';
import { TEAM_SPEAKERS } from '../types';
import type { Team } from '../types';

interface Props {
  onClose: () => void;
}

export function ExtensionAuditOverlay({ onClose }: Props) {
  const nodes = useRoundStore((s) => s.nodes);
  const links = useRoundStore((s) => s.links);

  const getNodeLabel = (id: string) => {
    const node = nodes.find((n) => n.id === id);
    if (!node) return '?';
    const speakerNodes = nodes.filter((n) => n.speaker === node.speaker);
    const num = speakerNodes.indexOf(node) + 1;
    return `${node.speaker} #${num}: "${node.text.slice(0, 35)}${node.text.length > 35 ? '...' : ''}"`;
  };

  const auditTeam = (closingTeam: Team, openingTeam: Team) => {
    const closingSpeakers = TEAM_SPEAKERS[closingTeam];
    const openingSpeakers = TEAM_SPEAKERS[openingTeam];
    const openingNodes = nodes.filter((n) => n.speaker && openingSpeakers.includes(n.speaker));
    const closingNodes = nodes.filter((n) => n.speaker && closingSpeakers.includes(n.speaker));

    // Find extension links from closing to opening
    const extensionLinks = links.filter(
      (l) => l.type === 'extension' &&
        (closingNodes.some((n) => n.id === l.target) || closingNodes.some((n) => n.id === l.source))
    );

    // Which opening nodes have been extended
    const extendedOpeningIds = new Set<string>();
    for (const link of extensionLinks) {
      if (openingNodes.some((n) => n.id === link.source)) extendedOpeningIds.add(link.source);
      if (openingNodes.some((n) => n.id === link.target)) extendedOpeningIds.add(link.target);
    }

    // Also check nodes that have 'extends' field
    for (const cn of closingNodes) {
      if (cn.extends && openingNodes.some((n) => n.id === cn.extends)) {
        extendedOpeningIds.add(cn.extends);
      }
    }

    // Extensions made by closing speakers
    const extensions = closingNodes
      .filter((n) => n.type === 'extension')
      .map((n) => {
        const sourceRef = n.extends ? getNodeLabel(n.extends) : null;
        return { node: n, sourceRef };
      });

    return {
      closingTeam,
      openingTeam,
      openingNodes,
      extendedOpeningIds,
      extensions,
      closingSpeakers,
    };
  };

  const cgAudit = auditTeam('CG', 'OG');
  const coAudit = auditTeam('CO', 'OO');

  const renderAudit = (audit: ReturnType<typeof auditTeam>) => (
    <div className="mb-4">
      <h3 className="text-[11px] font-mono text-text-bright mb-2">
        {audit.closingTeam} (extending {audit.openingTeam})
      </h3>

      {/* Extensions made */}
      {audit.extensions.length > 0 ? (
        audit.extensions.map((ext) => (
          <div key={ext.node.id} className="flex items-start gap-1.5 text-[10px] mb-1 pl-2">
            <span className="text-type-refutation">✓</span>
            <span className="text-text-secondary">
              {ext.node.speaker} ext.
              {ext.sourceRef && <span className="text-text-muted"> of {ext.sourceRef}</span>}
              {' — "'}
              {ext.node.text.slice(0, 40)}{ext.node.text.length > 40 ? '...' : ''}
              {'"'}
            </span>
          </div>
        ))
      ) : (
        <div className="text-[10px] text-text-muted italic pl-2 mb-1">
          No extensions logged for {audit.closingTeam}
        </div>
      )}

      {/* Unextended opening nodes */}
      {audit.openingNodes
        .filter((n) => !audit.extendedOpeningIds.has(n.id))
        .map((n) => (
          <div key={n.id} className="flex items-start gap-1.5 text-[10px] mb-1 pl-2">
            <span className="text-type-impact">✗</span>
            <span className="text-text-muted">
              {getNodeLabel(n.id)} — not extended
            </span>
          </div>
        ))
      }
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]"
      onClick={onClose}
    >
      <div
        className="bg-bg-card border border-border-subtle rounded-lg p-5 max-w-lg w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-bright font-sans text-base font-medium">Extension Audit</h2>
          <span className="text-text-muted text-xs font-mono">Esc to close</span>
        </div>

        {renderAudit(cgAudit)}
        <div className="border-b border-border-subtle my-3" />
        {renderAudit(coAudit)}
      </div>
    </div>
  );
}

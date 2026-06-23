import React, { useState, useRef, useCallback, useEffect } from 'react';
import { POE_TREE_NODES, POE_BRANCHES, POE_ATTRS, META_UNLOCK_REQS, POE_INDEX } from '../game/poe_tree';
import { Audio } from '../game/audio';

const TREE_W = 1800;
const TREE_H = 2680;

// ─── helpers ───────────────────────────────────
const nodeRadius = { minor: 18, notable: 27, keystone: 40 };

function isUnlocked(nodeId, skills) {
  const n = POE_INDEX[nodeId];
  if (!n) return false;
  if (!n.req || n.req.length === 0) return true;
  return n.req.every(r => (skills[r] || 0) >= 1);
}

// ─── Branch label X (average of branch nodes) ──
const branchLabelX = {};
for (const [key] of Object.entries(POE_BRANCHES)) {
  const ns = POE_TREE_NODES.filter(n => n.branch === key);
  branchLabelX[key] = ns.reduce((a, n) => a + n.x, 0) / (ns.length || 1);
}

// ─── Connection list ────────────────────────────
const CONNECTIONS = [];
for (const node of POE_TREE_NODES) {
  for (const reqId of (node.req || [])) {
    CONNECTIONS.push({ from: reqId, to: node.id, branch: node.branch });
  }
}

// ─── Attribute points available ────────────────
function availableAttrPoints(save) {
  const earned = Math.max(0, (save.profile?.level || 1) - 1);
  const spent = Object.values(save.attrs || {}).reduce((a, b) => a + b, 0);
  return earned - spent;
}

// ══════════════════════════════════════════════════════
export default function SkillTree({ save, setSave, onClose }) {
  const containerRef = useRef();
  const [scale, setScale] = useState(0.38);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState(null);
  const [attrOpen, setAttrOpen] = useState(false);
  const [toast, setToast] = useState('');
  const dragState = useRef({ active: false, startX: 0, startY: 0, startPanX: 0, startPanY: 0, moved: false });
  const initialized = useRef(false);

  const skills = save.skills || {};
  const attrs  = save.attrs  || {};
  const freeAttr = availableAttrPoints(save);

  // ── Center tree on first mount — show start nodes at bottom ──
  useEffect(() => {
    if (initialized.current) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0) return; // not laid out yet, retry
    const initScale = 0.38;
    const treeW = TREE_W * initScale;
    // Center horizontally
    const initX = (rect.width - treeW) / 2;
    // Show bottom of tree: start nodes at y=2380, want them ~80px from bottom of canvas
    const initY = rect.height - 80 - (TREE_H - 150) * initScale;
    setPan({ x: initX, y: initY });
    setScale(initScale);
    initialized.current = true;
  }, []);

  // ── Wheel zoom ───────────────────────────────────
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const delta = e.deltaY < 0 ? 1.12 : 0.9;
    setScale(prev => {
      const ns = Math.max(0.22, Math.min(3.0, prev * delta));
      const ratio = ns / prev;
      setPan(p => ({ x: mx - ratio * (mx - p.x), y: my - ratio * (my - p.y) }));
      return ns;
    });
  }, []);

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    c.addEventListener('wheel', handleWheel, { passive: false });
    return () => c.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ── Mouse pan ────────────────────────────────────
  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    dragState.current = { active: true, moved: false, startX: e.clientX, startY: e.clientY, startPanX: pan.x, startPanY: pan.y };
  };
  const onMouseMove = (e) => {
    if (!dragState.current.active) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragState.current.moved = true;
    setPan({ x: dragState.current.startPanX + dx, y: dragState.current.startPanY + dy });
  };
  const onMouseUp = () => { dragState.current.active = false; };

  // ── Buy node ─────────────────────────────────────
  const buyNode = (node) => {
    if (!isUnlocked(node.id, skills)) return;
    const lvl = skills[node.id] || 0;
    if (lvl >= node.max) return;
    if (save.sp < node.c) { showToast('NOT ENOUGH SP'); return; }
    setSave({ ...save, sp: save.sp - node.c, skills: { ...save.skills, [node.id]: lvl + 1 } });
    Audio?.click?.();
    showToast(`${node.name} Lv.${lvl + 1}`);
  };

  // ── Buy attribute ─────────────────────────────────
  const buyAttr = (attrId) => {
    if (freeAttr <= 0) { showToast('NO ATTRIBUTE POINTS'); return; }
    const cur = attrs[attrId] || 0;
    setSave({ ...save, attrs: { ...save.attrs, [attrId]: cur + 1 } });
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1400);
  };

  // ── Node click ───────────────────────────────────
  const onNodeClick = (e, node) => {
    e.stopPropagation();
    if (dragState.current.moved) return;
    setSelected(prev => prev?.id === node.id ? null : node);
  };

  const selNode = selected ? POE_INDEX[selected.id] : null;
  const selLvl  = selNode ? (skills[selNode.id] || 0) : 0;
  const selBranch = selNode ? POE_BRANCHES[selNode.branch] : null;
  const selCanBuy = selNode && isUnlocked(selNode.id, skills) && selLvl < selNode.max && save.sp >= selNode.c;
  const selLocked = selNode && !isUnlocked(selNode.id, skills);

  return (
    <div className="poe-overlay" data-testid="skill-tree" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="poe-panel">

        {/* ── Top Bar ── */}
        <div className="poe-topbar">
          <div className="poe-topbar-left">
            <span className="poe-title">SKILL TREE</span>
            <span className="poe-sp">◆ {save.sp} SP</span>
            <span className="poe-hint">Drag to pan · Scroll to zoom · Click to inspect</span>
          </div>
          <div className="poe-topbar-right">
            {freeAttr > 0 && (
              <span className="poe-attr-badge" onClick={() => setAttrOpen(v => !v)} data-testid="poe-attr-btn">
                ⚡ {freeAttr} ATTRIBUTE{freeAttr > 1 ? 'S' : ''} AVAILABLE
              </span>
            )}
            {freeAttr === 0 && (
              <span className="poe-attr-btn-dim" onClick={() => setAttrOpen(v => !v)} data-testid="poe-attr-btn">
                ⚡ ATTRIBUTES
              </span>
            )}
            <button className="poe-close-btn" onClick={onClose} data-testid="st-close">✕</button>
          </div>
        </div>

        {/* ── Main body ── */}
        <div className="poe-body">

          {/* ── SVG Canvas ── */}
          <div
            ref={containerRef}
            className="poe-canvas"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            style={{ cursor: dragState.current.active ? 'grabbing' : 'grab' }}
          >
            <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
              <defs>
                <filter id="poe-glow">
                  <feGaussianBlur stdDeviation="4" result="b"/>
                  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="poe-glow-hard">
                  <feGaussianBlur stdDeviation="8" result="b"/>
                  <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>

              <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>

                {/* ── Background subtle grid ── */}
                {Array.from({ length: 20 }).map((_, i) => (
                  <line key={`vg${i}`} x1={i * 100} y1={0} x2={i * 100} y2={TREE_H} stroke="#1a0830" strokeWidth={1} opacity={0.4} />
                ))}
                {Array.from({ length: 28 }).map((_, i) => (
                  <line key={`hg${i}`} x1={0} y1={i * 100} x2={TREE_W} y2={i * 100} stroke="#1a0830" strokeWidth={1} opacity={0.4} />
                ))}

                {/* ── Category labels (bottom) ── */}
                {Object.entries(POE_BRANCHES).map(([key, b]) => (
                  <text key={`lbl-${key}`} x={branchLabelX[key]} y={2560} textAnchor="middle"
                    fill={b.color} fontSize={20} fontFamily="VT323" opacity={0.75} letterSpacing={2}>
                    {b.icon} {b.name}
                  </text>
                ))}

                {/* ── Connection lines ── */}
                {CONNECTIONS.map(({ from, to, branch: br }) => {
                  const fnNode = POE_INDEX[from];
                  const toNode = POE_INDEX[to];
                  if (!fnNode || !toNode) return null;
                  const bCol = POE_BRANCHES[br]?.color || '#3a2a6e';
                  const ownedFrom = (skills[from] || 0) >= 1;
                  const ownedTo   = (skills[to]   || 0) >= 1;
                  const active    = ownedFrom && ownedTo;
                  const partial   = ownedFrom && !ownedTo;
                  return (
                    <g key={`ln-${from}-${to}`}>
                      {/* Glow underlay for active connections */}
                      {active && (
                        <line x1={fnNode.x} y1={fnNode.y} x2={toNode.x} y2={toNode.y}
                          stroke={bCol} strokeWidth={8} opacity={0.15} strokeLinecap="round" />
                      )}
                      <line x1={fnNode.x} y1={fnNode.y} x2={toNode.x} y2={toNode.y}
                        stroke={active ? bCol : partial ? bCol : '#241538'}
                        strokeWidth={active ? 3 : 2}
                        opacity={active ? 0.85 : partial ? 0.4 : 0.25}
                        strokeLinecap="round"
                        strokeDasharray={partial ? '6 4' : undefined}
                      />
                    </g>
                  );
                })}

                {/* ── Nodes ── */}
                {POE_TREE_NODES.map(node => {
                  const b    = POE_BRANCHES[node.branch];
                  const lvl  = skills[node.id] || 0;
                  const unlk = isUnlocked(node.id, skills);
                  const maxd = lvl >= node.max;
                  const purd = lvl > 0;
                  const isSel = selected?.id === node.id;
                  const r    = nodeRadius[node.type] || 18;

                  // Colors
                  let fill   = '#0e0720';
                  let stroke = '#2e1a4e';
                  let sw     = 1.5;
                  let glowFilter = undefined;

                  if (maxd) {
                    fill = '#2a1a00'; stroke = '#ffd700'; sw = 3;
                    glowFilter = 'url(#poe-glow)';
                  } else if (purd) {
                    fill = b.color + '22'; stroke = b.color; sw = 2;
                    glowFilter = 'url(#poe-glow)';
                  } else if (unlk) {
                    fill = '#12083a'; stroke = b.color; sw = 2;
                    glowFilter = 'url(#poe-glow)';
                  }

                  if (isSel) { sw = 4; glowFilter = 'url(#poe-glow-hard)'; }

                  return (
                    <g key={node.id} filter={glowFilter}
                      onClick={(e) => onNodeClick(e, node)}
                      style={{ cursor: 'pointer' }}>

                      {/* Selection ring */}
                      {isSel && (
                        <circle cx={node.x} cy={node.y} r={r + 12}
                          fill="none" stroke={b.color} strokeWidth={1.5} opacity={0.5}
                          strokeDasharray="8 4" />
                      )}

                      {/* Keystone diamond backdrop */}
                      {node.type === 'keystone' && (
                        <polygon
                          points={`${node.x},${node.y - r - 10} ${node.x + r + 10},${node.y} ${node.x},${node.y + r + 10} ${node.x - r - 10},${node.y}`}
                          fill={fill} stroke={stroke} strokeWidth={sw * 0.7} opacity={0.6}
                        />
                      )}

                      {/* Notable hex backdrop */}
                      {node.type === 'notable' && (() => {
                        const pts = Array.from({ length: 6 }).map((_, i) => {
                          const a = (i * 60 - 30) * Math.PI / 180;
                          return `${node.x + (r + 5) * Math.cos(a)},${node.y + (r + 5) * Math.sin(a)}`;
                        }).join(' ');
                        return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw * 0.5} opacity={0.4} />;
                      })()}

                      {/* Main circle */}
                      <circle cx={node.x} cy={node.y} r={r}
                        fill={fill} stroke={stroke} strokeWidth={sw} />

                      {/* Filled arc to show level progress */}
                      {purd && !maxd && node.max > 1 && (() => {
                        const pct = lvl / node.max;
                        const startAngle = -Math.PI / 2;
                        const endAngle   = startAngle + pct * 2 * Math.PI;
                        const x1 = node.x + r * Math.cos(startAngle);
                        const y1 = node.y + r * Math.sin(startAngle);
                        const x2 = node.x + r * Math.cos(endAngle);
                        const y2 = node.y + r * Math.sin(endAngle);
                        const lg = pct > 0.5 ? 1 : 0;
                        return (
                          <path d={`M ${node.x} ${node.y} L ${x1} ${y1} A ${r} ${r} 0 ${lg} 1 ${x2} ${y2} Z`}
                            fill={b.color + '55'} stroke="none" />
                        );
                      })()}

                      {/* Maxed fill */}
                      {maxd && <circle cx={node.x} cy={node.y} r={r} fill="#ffd70040" stroke="none" />}

                      {/* Icon */}
                      <text x={node.x} y={node.y + 6} textAnchor="middle"
                        fontSize={node.type === 'keystone' ? 22 : node.type === 'notable' ? 16 : 13}
                        style={{ pointerEvents: 'none', userSelect: 'none' }}>
                        {node.icon}
                      </text>

                      {/* Level badge */}
                      {purd && node.max > 1 && (
                        <text x={node.x + r - 2} y={node.y - r + 7} textAnchor="middle"
                          fontSize={9} fill={maxd ? '#ffd700' : '#fff'} fontFamily="VT323"
                          style={{ pointerEvents: 'none' }}>
                          {lvl}
                        </text>
                      )}

                      {/* Lock icon on locked nodes */}
                      {!unlk && (
                        <text x={node.x} y={node.y + r + 14} textAnchor="middle"
                          fontSize={10} fill="#5a3a7e" fontFamily="VT323"
                          style={{ pointerEvents: 'none' }}>
                          LOCKED
                        </text>
                      )}
                    </g>
                  );
                })}

              </g>
            </svg>

            {/* Zoom hint */}
            <div className="poe-zoom-hint">
              {Math.round(scale * 100)}%
            </div>
          </div>

          {/* ── Preview Panel ── */}
          <div className={`poe-preview ${selNode ? 'open' : ''}`}>
            {selNode ? (
              <>
                <div className="poe-prev-branch" style={{ color: selBranch?.color }}>
                  {selBranch?.icon} {selBranch?.name}
                </div>
                <div className="poe-prev-icon" style={{ textShadow: `0 0 20px ${selBranch?.color}` }}>
                  {selNode.icon}
                </div>
                <div className="poe-prev-name">{selNode.name}</div>
                <div className="poe-prev-type" style={{ color: selBranch?.color }}>
                  {selNode.type.toUpperCase()}
                  {selNode.active && ' · ACTIVE SKILL'}
                </div>
                <div className="poe-prev-desc">{selNode.desc}</div>
                <div className="poe-prev-level">
                  {Array.from({ length: selNode.max }).map((_, i) => (
                    <span key={i} className={`poe-lvl-pip ${i < selLvl ? 'on' : ''}`}
                      style={{ '--pc': selBranch?.color }} />
                  ))}
                  <span className="poe-lvl-text">{selLvl} / {selNode.max}</span>
                </div>
                <div className="poe-prev-cost">◆ {selNode.c} SP per level</div>

                {selLocked && (() => {
                  const reqNode = selNode.req?.[0] ? POE_INDEX[selNode.req[0]] : null;
                  return (
                    <div className="poe-prev-locked">
                      🔒 Kräver: {reqNode?.name || selNode.req?.[0]}
                    </div>
                  );
                })()}

                {!selLocked && selLvl >= selNode.max && (
                  <div className="poe-prev-maxed">MAXED ✓</div>
                )}

                {!selLocked && selLvl < selNode.max && (
                  <button
                    className={`poe-buy-btn ${selCanBuy ? 'can' : 'cant'}`}
                    onClick={() => buyNode(selNode)}
                    disabled={!selCanBuy}
                    data-testid={`buy-poe-${selNode.id}`}
                  >
                    {selCanBuy ? `BUY — ◆ ${selNode.c} SP` : save.sp < selNode.c ? `NEED ◆ ${selNode.c} SP` : 'UNLOCK TREE FIRST'}
                  </button>
                )}

                <button className="poe-desel-btn" onClick={() => setSelected(null)}>← Back</button>
              </>
            ) : (
              <div className="poe-prev-empty">
                <div style={{ fontSize: 40, marginBottom: 12 }}>🌌</div>
                <div style={{ fontFamily: 'VT323', fontSize: 18, color: '#4a3a6e', letterSpacing: 2 }}>
                  SELECT A NODE
                </div>
                <div style={{ fontSize: 12, color: '#3a2a5e', marginTop: 8, lineHeight: 1.6 }}>
                  Click any node<br/>to inspect & buy
                </div>
                <div style={{ marginTop: 24, fontSize: 11, color: '#3a2a4e', lineHeight: 1.8 }}>
                  ◆ {save.sp} SP available
                </div>
                <div style={{ marginTop: 6, fontSize: 11, color: '#3a2a4e' }}>
                  ⚡ {freeAttr} attr pts free
                </div>
                {Object.entries(POE_BRANCHES).map(([key, b]) => {
                  const bNodes = POE_TREE_NODES.filter(n => n.branch === key);
                  const owned = bNodes.filter(n => (skills[n.id] || 0) >= 1).length;
                  return (
                    <div key={key} className="poe-branch-summary" style={{ '--bc': b.color }}>
                      <span>{b.icon} {b.name}</span>
                      <span>{owned}/{bNodes.length}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Attribute Overlay ── */}
        {attrOpen && (
          <div className="poe-attr-overlay" data-testid="poe-attr-overlay">
            <div className="poe-attr-header">
              <span>⚡ ATTRIBUTES</span>
              <span className="poe-attr-free">{freeAttr} points free</span>
              <button onClick={() => setAttrOpen(false)} className="poe-attr-close">✕</button>
            </div>
            <div className="poe-attr-desc">Earned 1 per profile level. Permanent bonuses.</div>
            <div className="poe-attr-grid">
              {POE_ATTRS.map(a => {
                const cur = attrs[a.id] || 0;
                const canAdd = freeAttr > 0;
                return (
                  <div key={a.id} className="poe-attr-row" data-testid={`attr-${a.id}`}>
                    <span className="poe-attr-icon" style={{ color: a.color }}>{a.icon}</span>
                    <div className="poe-attr-info">
                      <span className="poe-attr-name">{a.name}</span>
                      <span className="poe-attr-desc2">{a.desc}</span>
                    </div>
                    <div className="poe-attr-ctl">
                      <span className="poe-attr-val">{cur}</span>
                      <button
                        className={`poe-attr-add ${canAdd ? '' : 'disabled'}`}
                        onClick={() => buyAttr(a.id)}
                        disabled={!canAdd}
                        data-testid={`attr-add-${a.id}`}
                      >+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Toast ── */}
        {toast && <div className="poe-toast">{toast}</div>}

      </div>
    </div>
  );
}

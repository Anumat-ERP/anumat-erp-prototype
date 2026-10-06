import { Badge, Button, IconButton, Tabs, TabsList, TabsTrigger, Text } from '@app/ui';
import { Handle, MarkerType, Position, ReactFlow, ReactFlowProvider, useReactFlow, type Edge, type Node, type NodeProps } from '@xyflow/react';
import { Check, Circle, FileCheck2, Maximize, Play, RotateCcw, Undo2, UserCheck, X, ZoomIn, ZoomOut } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import type { ApprovalStep, ProcessStep } from '../data/types';
import { useStore } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';
import '@xyflow/react/dist/style.css';
import '../styles/process-simulation.css';

type Phase = 'idle' | 'running' | 'approved' | 'returned' | 'declined';
type FlowNode = Node<{ title: string; subtitle: string; status: string; state: string; horizontal?: boolean }, 'approval'>;
const ApprovalNode = memo(function ApprovalNode({ data }: NodeProps<FlowNode>) {
  const Icon = data.state === 'done' ? Check : data.state === 'current' ? UserCheck : data.state === 'returned' ? Undo2 : data.state === 'declined' ? X : data.state === 'terminal' ? FileCheck2 : Circle;
  return <div className="an-simulation-node" data-state={data.state}>
    <Handle type="target" position={data.horizontal ? Position.Left : Position.Top} />
    <span className="an-simulation-node-icon"><Icon size={18} aria-hidden /></span>
    <div><strong title={data.title}>{data.title}</strong><span>{data.subtitle}</span><small>{data.status}</small></div>
    <Handle type="source" position={data.horizontal ? Position.Right : Position.Bottom} />
  </div>;
});
const nodeTypes = { approval: ApprovalNode };

export default function ProcessSimulation(props: { steps: ApprovalStep[]; allSteps: ProcessStep[] }) {
  return <ReactFlowProvider><Simulation {...props} /></ReactFlowProvider>;
}
function Simulation({ steps, allSteps }: { steps: ApprovalStep[]; allSteps: ProcessStep[] }) {
  const { t: tr } = useLocale();
  const { person } = useStore();
  const flow = useReactFlow();
  const [horizontal, setHorizontal] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const update = () => setHorizontal(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const [phase, setPhase] = useState<Phase>('idle');
  const [current, setCurrent] = useState(0);
  const [view, setView] = useState('diagram');
  const [showSkipped, setShowSkipped] = useState(false);
  const skipped = allSteps.filter((step) => !steps.some((included) => included.id === step.id));
  const stateFor = (index: number) => phase === 'approved' || (phase !== 'idle' && index < current) ? 'done' : index === current && phase !== 'idle' ? phase === 'running' ? 'current' : phase : 'waiting';
  const statusFor = (state: string) => tr(state === 'done' ? 'Approved' : state === 'current' ? 'Waiting for a decision' : state === 'returned' ? 'Sent back' : state === 'declined' ? 'Declined' : 'Not started');
  const outcome = tr(phase === 'approved' ? 'Simulation: request approved' : phase === 'returned' ? 'Simulation: returned to the requester' : phase === 'declined' ? 'Simulation: request declined' : phase === 'running' ? 'Simulation: waiting for {name}' : 'Ready to simulate', { name: steps[current] ? person(steps[current]!.approverId).name : '' });
  const nodes: FlowNode[] = [
    { id: 'simulation-start', type: 'approval', position: { x: 0, y: 0 }, data: { horizontal, title: tr('Request submitted'), subtitle: tr('Sample answers'), state: phase === 'idle' ? 'terminal' : 'done', status: tr('Preview only') } },
    ...steps.map((step, index) => ({ id: `simulation-${step.id}`, type: 'approval' as const, position: { x: horizontal ? (index + 1) * 290 : 0, y: horizontal ? 0 : (index + 1) * 142 }, data: { horizontal, title: tr(step.name), subtitle: person(step.approverId).name, state: stateFor(index), status: statusFor(stateFor(index)) } })),
    { id: 'simulation-end', type: 'approval', position: { x: horizontal ? (steps.length + 1) * 290 : 0, y: horizontal ? 0 : (steps.length + 1) * 142 }, data: { horizontal, title: tr('Request outcome'), subtitle: phase === 'approved' ? tr('Approved') : phase === 'returned' ? tr('Sent back') : phase === 'declined' ? tr('Declined') : tr('Pending'), state: phase === 'approved' ? 'done' : phase === 'returned' || phase === 'declined' ? phase : 'terminal', status: tr('Preview only') } },
  ];
  useEffect(() => {
    if (view !== 'diagram') return;
    const frame = requestAnimationFrame(() => { void flow.fitView({ padding: .08, maxZoom: 1 }); });
    return () => cancelAnimationFrame(frame);
  }, [horizontal, view, steps.length, flow.fitView]);
  const edges: Edge[] = nodes.slice(1).map((node, index) => ({ id: `simulation-edge-${index}`, source: nodes[index]!.id, target: node.id, markerEnd: { type: MarkerType.ArrowClosed }, type: 'smoothstep' }));
  return <section className="flex min-w-0 flex-col gap-4" aria-label={tr('Approval flow simulation')}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><Text as="h3" variant="subtitle">{tr('Try the approval flow')}</Text><Text variant="caption" tone="muted">{tr('Sample decisions only. Changing inputs resets the simulation.')}</Text></div>
      <Badge tone="info">{tr('Simulation')}</Badge>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Tabs value={view} onValueChange={setView}><TabsList aria-label={tr('Simulation view')}><TabsTrigger value="diagram">{tr('Diagram')}</TabsTrigger><TabsTrigger value="list">{tr('List')}</TabsTrigger></TabsList></Tabs>
      <div className="flex gap-1">
        {view === 'diagram' && <><IconButton icon={<ZoomIn />} label={tr('Zoom in')} onClick={() => flow.zoomIn()} /><IconButton icon={<ZoomOut />} label={tr('Zoom out')} onClick={() => flow.zoomOut()} /><IconButton icon={<Maximize />} label={tr('Fit flow')} onClick={() => flow.fitView({ padding: .08 })} /></>}
        <IconButton icon={<RotateCcw />} label={tr('Reset simulation')} onClick={() => { setPhase('idle'); setCurrent(0); }} />
      </div>
    </div>
    {view === 'diagram' ? <div className="an-simulation-canvas" style={{ height: horizontal ? 260 : Math.min(700, Math.max(400, nodes.length * 142 + 50)) }} role="region" aria-label={tr('Approval flow diagram')}>
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: .08, maxZoom: 1 }} minZoom={.2} maxZoom={1.5} nodesDraggable={false} nodesConnectable={false} nodesFocusable={false} edgesFocusable={false} elementsSelectable={false} deleteKeyCode={null} zoomOnScroll={false} zoomOnDoubleClick={false} preventScrolling={false} disableKeyboardA11y />
    </div> : <ol className="an-simulation-list">{nodes.map((node) => <li key={node.id} data-state={node.data.state}><strong>{node.data.title}</strong><span>{node.data.subtitle} · {node.data.status}</span></li>)}</ol>}
    <Text variant="bodySm" aria-live="polite" role="status">{outcome}</Text>
    <div className="flex flex-wrap gap-2">
      {phase === 'idle' ? <Button variant="primary" icon={<Play />} onClick={() => { setCurrent(0); setPhase(steps.length ? 'running' : 'approved'); }}>{tr('Start simulation')}</Button> : phase === 'running' ? <>
        <Button variant="primary" icon={<Check />} onClick={() => { if (current + 1 >= steps.length) setPhase('approved'); else setCurrent(current + 1); }}>{tr('Simulate approval')}</Button>
        <Button icon={<Undo2 />} onClick={() => setPhase('returned')}>{tr('Simulate send back')}</Button>
        <Button icon={<X />} onClick={() => setPhase('declined')}>{tr('Simulate decline')}</Button>
      </> : <Button icon={<RotateCcw />} onClick={() => { setCurrent(0); setPhase('idle'); }}>{tr('Try again')}</Button>}
    </div>
    {skipped.length > 0 && <div className="flex flex-col gap-2 border-t border-border pt-3">
      <Button variant="plain" className="self-start" size="sm" aria-expanded={showSkipped} onClick={() => setShowSkipped(!showSkipped)}>{tr('{count} steps skipped by these inputs', { count: skipped.length })}</Button>
      {showSkipped && <ul className="flex flex-col gap-2">{skipped.map((step) => <li key={step.id} className="text-sm"><strong>{tr(step.name)}</strong><span className="text-fg-muted"> · {tr('Condition not met')}</span></li>)}</ul>}
    </div>}
    {!steps.length && <Text variant="bodySm" tone="muted">{tr('No approval steps match. This route approves without a reviewer. Check the conditions before saving.')}</Text>}
  </section>;
}

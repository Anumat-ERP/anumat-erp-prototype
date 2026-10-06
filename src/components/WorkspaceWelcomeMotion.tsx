import { useEffect, useRef, useState } from 'react';
import type { AnimationItem } from 'lottie-web';
import workspaceArt from '../assets/illustrations/workspace-folder.webp';

/** Decorative, local, one-shot motion. Static artwork is the default and recovery state. */
export function WorkspaceWelcomeMotion({ motion = 'auto' }: { motion?: 'auto' | 'static' }) {
  const container = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('static');
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReduced(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    const element = container.current;
    setReady(false); setStatus('static');
    if (!element || reduced || motion === 'static') return;
    let disposed = false;
    let visible = false;
    let loaded = false;
    let completed = false;
    let player: AnimationItem | undefined;
    const sync = () => {
      if (!player || !loaded || completed || disposed) return;
      if (visible && !document.hidden) { player.play(); setStatus('playing'); }
      else { player.pause(); setStatus('paused'); }
    };
    const observer = new IntersectionObserver(([entry]) => { visible = Boolean(entry?.isIntersecting); sync(); });
    observer.observe(element);
    document.addEventListener('visibilitychange', sync);
    void Promise.all([
      import('lottie-web/build/player/lottie_light'),
      import('../assets/animations/workspace-folder.json'),
    ]).then(([{ default: lottie }, { default: animationData }]) => {
      if (disposed) return;
      player = lottie.loadAnimation({ container: element, renderer: 'svg', loop: false, autoplay: false, initialSegment: [0, 198], animationData: structuredClone(animationData), rendererSettings: { preserveAspectRatio: 'xMidYMid meet' } });
      player.setSpeed(1.6);
      player.addEventListener('DOMLoaded', () => { if (disposed) return; loaded = true; setReady(true); sync(); });
      player.addEventListener('complete', () => { if (disposed) return; completed = true; setStatus('complete'); });
      player.addEventListener('data_failed', () => { if (disposed) return; setReady(false); setStatus('fallback'); player?.destroy(); });
    }).catch(() => { if (!disposed) { setReady(false); setStatus('fallback'); } });
    return () => { disposed = true; observer.disconnect(); document.removeEventListener('visibilitychange', sync); player?.destroy(); };
  }, [motion, reduced]);
  return <div className="an-modules-art an-welcome-motion" aria-hidden="true" data-motion-status={status}>
    <img src={workspaceArt} alt="" width="1024" height="1024" className="an-welcome-motion-fallback" hidden={ready} />
    <div ref={container} className="an-welcome-motion-player" hidden={!ready} />
  </div>;
}

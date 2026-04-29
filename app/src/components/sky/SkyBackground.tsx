import { useState, useEffect, useMemo } from 'react';

/* ── Color math ── */
const h2r = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16),
];
const r2h = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mixH = (a: string, b: string, t: number) => {
  const [ar, ag, ab] = h2r(a), [br, bg, bb] = h2r(b);
  return r2h(mix(ar, br, t), mix(ag, bg, t), mix(ab, bb, t));
};
const mixA = (a: string[], b: string[], t: number) => a.map((c, i) => mixH(c, b[i], t));

/* ── Sky keyframes (hour → visual config) ── */
interface Kf {
  hour: number; sky: string[]; sunOp: number; sunY: number;
  moonOp: number; starOp: number; cloudOp: number;
}

const KFS: Kf[] = [
  { hour: 0,    sky: ['#0b1a2e','#0f1f3a','#152548','#1a2e55','#203560','#253f5a','#2a3a50'], sunOp: 0,    sunY: 85, moonOp: .9,  starOp: .9,  cloudOp: .12 },
  { hour: 5,    sky: ['#1a3050','#3a4a6a','#7a6070','#c09080','#e0b070','#d4a050','#c89030'], sunOp: .3,   sunY: 58, moonOp: .1,  starOp: .05, cloudOp: .45 },
  { hour: 7,    sky: ['#4a90c8','#6ab4d8','#90cce0','#b8ddd0','#d0d8a0','#d8c870','#d4a843'], sunOp: .9,   sunY: 10, moonOp: 0,   starOp: 0,   cloudOp: .80 },
  { hour: 12,   sky: ['#4a9ad8','#6ec0e8','#90d0ea','#b8e0d8','#d0dca0','#d8c870','#d4a843'], sunOp: 1,    sunY: 5,  moonOp: 0,   starOp: 0,   cloudOp: .85 },
  { hour: 16,   sky: ['#5a98cc','#78b0d4','#a0c4dc','#c8d4b8','#d4c890','#d0b050','#c89830'], sunOp: 1,    sunY: 12, moonOp: 0,   starOp: 0,   cloudOp: .80 },
  { hour: 18,   sky: ['#c07030','#d48838','#dca040','#e4b848','#dca030','#c48828','#a87020'], sunOp: .85,  sunY: 42, moonOp: 0,   starOp: 0,   cloudOp: .60 },
  { hour: 19.5, sky: ['#3a2050','#5a3058','#804040','#a05838','#8a4830','#704028','#503020'], sunOp: .35,  sunY: 68, moonOp: .2,  starOp: .15, cloudOp: .30 },
  { hour: 21,   sky: ['#0e1828','#121e35','#182845','#1e3050','#233858','#283e50','#2a3545'], sunOp: 0,    sunY: 85, moonOp: .8,  starOp: .80, cloudOp: .15 },
  { hour: 24,   sky: ['#0b1a2e','#0f1f3a','#152548','#1a2e55','#203560','#253f5a','#2a3a50'], sunOp: 0,    sunY: 85, moonOp: .9,  starOp: .9,  cloudOp: .12 },
];

const POS = [0, 15, 30, 45, 62, 80, 100]; // gradient stop positions

function getConfig() {
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  let lo = KFS[0], hi = KFS[1];
  for (let i = 0; i < KFS.length - 1; i++) {
    if (h >= KFS[i].hour && h < KFS[i + 1].hour) { lo = KFS[i]; hi = KFS[i + 1]; break; }
  }
  const t = (h - lo.hour) / (hi.hour - lo.hour);
  const sky = mixA(lo.sky, hi.sky, t);
  return {
    gradient: `linear-gradient(180deg, ${sky.map((c, i) => `${c} ${POS[i]}%`).join(', ')})`,
    sunOp: mix(lo.sunOp, hi.sunOp, t),
    sunY: mix(lo.sunY, hi.sunY, t),
    moonOp: mix(lo.moonOp, hi.moonOp, t),
    starOp: mix(lo.starOp, hi.starOp, t),
    cloudOp: mix(lo.cloudOp, hi.cloudOp, t),
  };
}

function genStars(n: number) {
  return Array.from({ length: n }, () => ({
    x: Math.random() * 100, y: Math.random() * 55,
    r: 0.6 + Math.random() * 1.6, d: Math.random() * 4,
  }));
}

export default function SkyBackground() {
  const [cfg, setCfg] = useState(getConfig);
  useEffect(() => { const id = setInterval(() => setCfg(getConfig()), 60_000); return () => clearInterval(id); }, []);
  const stars = useMemo(() => genStars(80), []);

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', overflow: 'hidden', zIndex: -20, background: cfg.gradient, transition: 'background 2s ease' }}>
      {/* Stars */}
      <div style={{ position: 'absolute', inset: 0, opacity: cfg.starOp, transition: 'opacity 2s' }}>
        {stars.map((s, i) => (
          <div key={i} style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: s.r, height: s.r, borderRadius: '50%', background: '#fff', animation: `twinkle ${2.5 + s.d}s ease-in-out ${s.d}s infinite` }} />
        ))}
      </div>

      {/* Moon (crescent) */}
      <div style={{ position: 'absolute', top: '12%', left: '15%', width: 40, height: 40, borderRadius: '50%', boxShadow: '8px -4px 0 2px #e8e0c0', opacity: cfg.moonOp, transition: 'opacity 2s', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '10%', left: '14%', width: 70, height: 70, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,200,180,0.12) 0%, transparent 70%)', opacity: cfg.moonOp, transition: 'opacity 2s', pointerEvents: 'none' }} />

      {/* Sun */}
      <div style={{ position: 'absolute', top: `${cfg.sunY}%`, right: '14%', width: 110, height: 110, borderRadius: '50%', background: 'radial-gradient(circle, #fff8dc 0%, #ffe566 30%, #ffcc00 60%, transparent 100%)', boxShadow: '0 0 60px 30px rgba(255,220,80,.45), 0 0 120px 60px rgba(255,200,40,.25), 0 0 200px 100px rgba(255,180,0,.12)', opacity: cfg.sunOp, transition: 'opacity 2s, top 2s', animation: cfg.sunOp > 0 ? 'sun-pulse 6s ease-in-out infinite' : 'none', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: `calc(${cfg.sunY}% + 15px)`, right: 'calc(14% - 40px)', width: 190, height: 190, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,240,180,.30) 0%, rgba(255,220,100,.10) 50%, transparent 100%)', opacity: cfg.sunOp, transition: 'opacity 2s, top 2s', pointerEvents: 'none' }} />

      {/* Clouds */}
      <Cloud top="10%" left="-8%"  sz={1.1}  dur={90}  del={0}   op={cfg.cloudOp * .85} />
      <Cloud top="5%"  left="20%" sz={0.7}  dur={110} del={-30} op={cfg.cloudOp * .60} />
      <Cloud top="18%" left="55%" sz={0.9}  dur={100} del={-50} op={cfg.cloudOp * .75} />
      <Cloud top="8%"  left="75%" sz={0.65} dur={120} del={-15} op={cfg.cloudOp * .55} />
      <Cloud top="22%" left="-15%" sz={1.0} dur={95}  del={-60} op={cfg.cloudOp * .70} />
      <Cloud top="14%" left="40%" sz={0.55} dur={130} del={-80} op={cfg.cloudOp * .50} />
      <Cloud top="26%" left="30%" sz={0.80} dur={105} del={-40} op={cfg.cloudOp * .60} />

      <style>{`
        @keyframes drift { 0%{transform:translateX(0)} 100%{transform:translateX(calc(100vw + 300px))} }
        @keyframes sun-pulse {
          0%,100%{box-shadow:0 0 60px 30px rgba(255,220,80,.45),0 0 120px 60px rgba(255,200,40,.25),0 0 200px 100px rgba(255,180,0,.12);transform:scale(1)}
          50%{box-shadow:0 0 80px 40px rgba(255,220,80,.55),0 0 160px 80px rgba(255,200,40,.32),0 0 260px 120px rgba(255,180,0,.18);transform:scale(1.04)}
        }
        @keyframes twinkle { 0%,100%{opacity:.2} 50%{opacity:1} }
      `}</style>
    </div>
  );
}

function Cloud({ top, left, sz, dur, del, op }: { top: string; left: string; sz: number; dur: number; del: number; op: number }) {
  const w = 220 * sz, h = 70 * sz;
  return (
    <div style={{ position: 'absolute', top, left, width: w, height: h, opacity: op, pointerEvents: 'none', animation: `drift ${dur}s linear ${del}s infinite`, willChange: 'transform', transition: 'opacity 2s' }}>
      <div style={{ position: 'absolute', bottom: 0, left: '10%', width: '80%', height: '55%', borderRadius: 9999, background: 'radial-gradient(ellipse at 50% 80%, rgba(255,255,255,.95) 0%, rgba(255,255,255,.70) 100%)' }} />
      <div style={{ position: 'absolute', bottom: '20%', left: '5%', width: '42%', height: '70%', borderRadius: 9999, background: 'radial-gradient(ellipse at 50% 70%, rgba(255,255,255,.92) 0%, rgba(255,255,255,.55) 100%)' }} />
      <div style={{ position: 'absolute', bottom: '25%', left: '25%', width: '50%', height: '85%', borderRadius: 9999, background: 'radial-gradient(ellipse at 50% 60%, rgba(255,255,255,.98) 0%, rgba(255,255,255,.60) 100%)' }} />
      <div style={{ position: 'absolute', bottom: '18%', left: '50%', width: '45%', height: '68%', borderRadius: 9999, background: 'radial-gradient(ellipse at 50% 70%, rgba(255,255,255,.90) 0%, rgba(255,255,255,.50) 100%)' }} />
    </div>
  );
}

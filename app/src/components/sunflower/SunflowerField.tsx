import { useEffect, useRef, useCallback } from 'react';

const PETAL_FILLS   = ['#F5C000', '#EDB800', '#F9CA10'];
const PETAL_SHADOWS = ['#C98A00', '#B87A00', '#D49000'];
const PETAL_LINES   = ['#A06800', '#8B5C00', '#B07000'];

// Each flower is exactly this wide — no gaps
const FLOWER_SLOT = 46; // px — tight packing
const HEAD_SZ     = 54; // px — head diameter (slightly larger than slot for overlap)
const STEM_H      = 120; // px

export default function SunflowerField() {
  const leanRef        = useRef(0);
  const currentLeanRef = useRef(0);
  const rafRef         = useRef<number>(0);
  const flowerRefs     = useRef<(HTMLDivElement | null)[]>([]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    leanRef.current = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
  }, []);
  const onTouchMove = useCallback((e: TouchEvent) => {
    leanRef.current = (e.touches[0].clientX - window.innerWidth / 2) / (window.innerWidth / 2);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove,  { passive: true });

    const MAX_LEAN = 22;
    const LERP     = 0.055;

    function animate(t: number) {
      currentLeanRef.current += (leanRef.current - currentLeanRef.current) * LERP;
      const lean = currentLeanRef.current;
      flowerRefs.current.forEach((el, i) => {
        if (!el) return;
        const sway = Math.sin(t * 0.00072 * (0.85 + (i % 5) * 0.08) + i * 0.61) * 3.8;
        el.style.transform = `rotate(${lean * MAX_LEAN + sway}deg)`;
      });
      rafRef.current = requestAnimationFrame(animate);
    }
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [onMouseMove, onTouchMove]);

  // 3 rows: back (small), middle, front (largest) — creates dense field
  const screenW   = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const totalH    = HEAD_SZ + STEM_H + 60; // extra top padding for sway

  const frontCount = Math.ceil(screenW / (FLOWER_SLOT * 0.75)) + 2;
  const midCount   = Math.ceil(screenW / (FLOWER_SLOT * 0.72)) + 2;
  const backCount  = Math.ceil(screenW / (FLOWER_SLOT * 0.68)) + 2;

  let idx = 0;

  type Flower = { x: number; scale: number; cv: number; bottom: number; zIdx: number; gIdx: number };

  const backFlowers: Flower[] = Array.from({ length: backCount }, (_, i) => ({
    x: ((i + 0.3) / backCount) * 102 - 1,
    scale: 0.52 + ((i * 3) % 5) * 0.035,
    cv: (i + 2) % 3, bottom: HEAD_SZ * 0.14, zIdx: 1, gIdx: idx++,
  }));

  const midFlowers: Flower[] = Array.from({ length: midCount }, (_, i) => ({
    x: ((i + 0.6) / midCount) * 102 - 1,
    scale: 0.70 + ((i * 5) % 5) * 0.035,
    cv: (i + 1) % 3, bottom: HEAD_SZ * 0.06, zIdx: 2, gIdx: idx++,
  }));

  const frontFlowers: Flower[] = Array.from({ length: frontCount }, (_, i) => ({
    x: (i / (frontCount - 1)) * 100,
    scale: 0.88 + ((i * 7) % 5) * 0.04,
    cv: i % 3, bottom: 0, zIdx: 3, gIdx: idx++,
  }));

  const allFlowers = [...backFlowers, ...midFlowers, ...frontFlowers];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        height: `${totalH}px`,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'visible',
        background: 'transparent',
      }}
    >
      {allFlowers.map((f) => {
        const hs = HEAD_SZ * f.scale;
        const sh = STEM_H * f.scale;
        return (
          <div
            key={f.gIdx}
            ref={el => { flowerRefs.current[f.gIdx] = el; }}
            style={{
              position: 'absolute',
              bottom: `${f.bottom}px`,
              left: `${f.x}%`,
              transform: 'translateX(-50%)',
              width: `${hs}px`,
              height: `${hs + sh}px`,
              transformOrigin: 'bottom center',
              willChange: 'transform',
              zIndex: f.zIdx,
            }}
          >
            <AnimeSunflower headSize={hs} stemHeight={sh} cv={f.cv} idx={f.gIdx} />
          </div>
        );
      })}
    </div>
  );
}

function AnimeSunflower({
  headSize, stemHeight, cv, idx,
}: {
  headSize: number;
  stemHeight: number;
  cv: number;
  idx: number;
}) {
  const W  = headSize;
  const SH = stemHeight;
  const TH = W + SH;
  const cx = W / 2;
  const cy = W / 2;

  const stemW   = Math.max(3, W * 0.14);
  const outline = '#1A1200';

  const petalFill   = PETAL_FILLS[cv];
  const petalShadow = PETAL_SHADOWS[cv];
  const petalLine   = PETAL_LINES[cv];

  const OUTER  = 16;
  const outerR = W * 0.41;
  const petalW = W * 0.16;
  const petalH = W * 0.28;

  const INNER   = 10;
  const innerR  = W * 0.27;
  const iPetalH = W * 0.18;
  const iPetalW = W * 0.11;

  const ly1  = W + SH * 0.38;
  const ly2  = W + SH * 0.60;
  const leafW = W * 0.52;
  const leafH = W * 0.17;

  return (
    <svg
      width={W} height={TH}
      viewBox={`0 0 ${W} ${TH}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={`pet${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor={petalFill}   />
          <stop offset="100%" stopColor={petalShadow} />
        </linearGradient>
        <radialGradient id={`ctr${idx}`} cx="36%" cy="28%" r="68%">
          <stop offset="0%"   stopColor="#A06530" />
          <stop offset="50%"  stopColor="#6B3A10" />
          <stop offset="100%" stopColor="#311200" />
        </radialGradient>
        <linearGradient id={`st${idx}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#236B18" />
          <stop offset="45%"  stopColor="#3DA828" />
          <stop offset="100%" stopColor="#236B18" />
        </linearGradient>
        <linearGradient id={`lf${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#3DA828" />
          <stop offset="100%" stopColor="#1E5C12" />
        </linearGradient>
      </defs>

      {/* STEM — goes all the way to bottom of SVG */}
      <rect
        x={cx - stemW / 2}
        y={W * 0.44}
        width={stemW}
        height={TH - W * 0.44} // extends fully to bottom
        fill={`url(#st${idx})`}
        rx={stemW / 2}
      />
      {/* stem outline */}
      <rect
        x={cx - stemW / 2} y={W * 0.44}
        width={stemW} height={TH - W * 0.44}
        fill="none" stroke={outline} strokeWidth="0.9"
        rx={stemW / 2} opacity="0.2"
      />

      {/* LEFT LEAF */}
      <g transform={`translate(${cx - W * 0.04},${ly1}) rotate(-42)`}>
        <ellipse rx={leafW * 0.5} ry={leafH * 0.5}
          fill={`url(#lf${idx})`} stroke={outline} strokeWidth="0.9" />
        <line x1={-leafW * 0.44} y1={0} x2={leafW * 0.08} y2={0}
          stroke={outline} strokeWidth={Math.max(0.5, stemW * 0.28)}
          strokeLinecap="round" opacity="0.3" />
      </g>

      {/* RIGHT LEAF */}
      <g transform={`translate(${cx + W * 0.04},${ly2}) rotate(42)`}>
        <ellipse rx={leafW * 0.5} ry={leafH * 0.5}
          fill={`url(#lf${idx})`} stroke={outline} strokeWidth="0.9" />
        <line x1={-leafW * 0.08} y1={0} x2={leafW * 0.44} y2={0}
          stroke={outline} strokeWidth={Math.max(0.5, stemW * 0.28)}
          strokeLinecap="round" opacity="0.3" />
      </g>

      {/* OUTER PETALS */}
      {Array.from({ length: OUTER }).map((_, p) => {
        const rot = (p / OUTER) * 360 - 90;
        return (
          <g key={`op${p}`} transform={`rotate(${rot}, ${cx}, ${cy})`}>
            <path
              d={`
                M ${cx} ${cy - W * 0.17}
                C ${cx + petalW * 0.55} ${cy - W * 0.20},
                  ${cx + petalW * 0.38} ${cy - outerR - petalH * 0.52},
                  ${cx} ${cy - outerR - petalH * 0.56}
                C ${cx - petalW * 0.38} ${cy - outerR - petalH * 0.52},
                  ${cx - petalW * 0.55} ${cy - W * 0.20},
                  ${cx} ${cy - W * 0.17}
                Z
              `}
              fill={`url(#pet${idx})`}
              stroke={outline} strokeWidth="1.0" strokeLinejoin="round"
            />
            <line
              x1={cx} y1={cy - W * 0.20}
              x2={cx} y2={cy - outerR - petalH * 0.32}
              stroke={petalLine} strokeWidth={W * 0.018}
              strokeLinecap="round" opacity="0.5"
            />
          </g>
        );
      })}

      {/* INNER PETALS */}
      {Array.from({ length: INNER }).map((_, p) => {
        const rot = (p / INNER) * 360 - 90 + (180 / INNER);
        return (
          <g key={`ip${p}`} transform={`rotate(${rot}, ${cx}, ${cy})`}>
            <path
              d={`
                M ${cx} ${cy - W * 0.15}
                C ${cx + iPetalW * 0.5} ${cy - W * 0.18},
                  ${cx + iPetalW * 0.32} ${cy - innerR - iPetalH * 0.42},
                  ${cx} ${cy - innerR - iPetalH * 0.46}
                C ${cx - iPetalW * 0.32} ${cy - innerR - iPetalH * 0.42},
                  ${cx - iPetalW * 0.5} ${cy - W * 0.18},
                  ${cx} ${cy - W * 0.15}
                Z
              `}
              fill={petalShadow} stroke={outline}
              strokeWidth="0.7" opacity="0.88"
            />
          </g>
        );
      })}

      {/* CENTER DISC */}
      <circle cx={cx} cy={cy} r={W * 0.22}
        fill={`url(#ctr${idx})`} stroke={outline} strokeWidth="1.3" />

      {Array.from({ length: 12 }).map((_, d) => {
        const a  = (d / 12) * Math.PI * 2;
        const dr = W * 0.13;
        return (
          <circle key={`sd${d}`}
            cx={cx + Math.cos(a) * dr} cy={cy + Math.sin(a) * dr}
            r={W * 0.019} fill="#BF6E1A" opacity="0.45"
          />
        );
      })}

      {/* Anime gloss */}
      <ellipse
        cx={cx - W * 0.065} cy={cy - W * 0.07}
        rx={W * 0.068} ry={W * 0.042}
        fill="white" opacity="0.22"
        transform={`rotate(-28, ${cx - W * 0.065}, ${cy - W * 0.07})`}
      />
    </svg>
  );
}

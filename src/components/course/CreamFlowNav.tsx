import React, { useRef, useState, useEffect, useCallback } from 'react';

export type TabType = 'about' | 'outcomes' | 'courses' | 'includes' | 'reviews';

interface CreamFlowNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  reviewCount: number;
}

const FROSTING_WIDTH = 140;
const FROSTING_HEIGHT = 80;

/**
 * BESPOKE REALISTIC CREAM & GLAZE FLOWING DESIGNS (Inspired by Reference Glaze Drips)
 *
 * Each feature tab features a completely distinct flowing cream morphology:
 * 1. About:    "The Signature Hanging Droplet" - Center deep bulbous teardrop (y=71) with pinched neck & soft shoulders
 * 2. Outcomes: "The Spatula S-Wave & Trailing Drip" - Asymmetrical sweeping cascade with a deep trailing droplet (y=74)
 * 3. Courses:  "The Triple Droplet Cascade" - 3 graduated teardrop streams (left 60, center 73, right 51)
 * 4. Includes: "The Waffle Glaze Quartet" - 4 rich alternating hanging streams (50, 68, 52, 67)
 * 5. Reviews:  "The Deep Twin Teardrops" - Symmetrical double bulbous droplets (y=68) with a high rising central arch
 *
 * All 5 designs collapse cleanly to y = 36.00 at morph = 0 (perfect flat capsule).
 */
function getFeatureTabPath(tab: TabType, morph: number): string {
  const clamp01 = (v: number) => Math.max(0, Math.min(1.08, v));
  const yBase = 36;

  if (tab === 'about') {
    // 1. ABOUT: Center deep bulbous teardrop (neck at 49, bulb at 62, tip at 71), twin side waves
    const mMid = clamp01(morph * 1.15);
    const mSide = clamp01((morph - 0.08) * 1.18);

    const rY = (yBase + 11 * mSide).toFixed(2);
    const mNeckY = (yBase + 12 * mMid).toFixed(2);
    const mBulbY = (yBase + 24 * mMid).toFixed(2);
    const mTipY = (yBase + 32 * mMid).toFixed(2);
    const lY = (yBase + 11 * mSide).toFixed(2);

    return [
      'M 18,2 L 122,2 A 16,16 0 0,1 138,18 A 16,16 0 0,1 122,36',
      // Right wave
      `C 116,36 112,${rY} 104,${rY}`,
      `C 96,${rY} 92,36 86,36`,
      // Center bulbous teardrop (narrow neck, swollen rounded drop tip)
      `C 80,36 76,${mNeckY} 74,${mNeckY}`,
      `C 77,${mBulbY} 76,${mTipY} 70,${mTipY}`,
      `C 64,${mTipY} 63,${mBulbY} 66,${mNeckY}`,
      `C 64,${mNeckY} 60,36 54,36`,
      // Left wave
      `C 48,36 44,${lY} 36,${lY}`,
      `C 28,${lY} 24,36 18,36`,
      'A 16,16 0 0,1 2,18 A 16,16 0 0,1 18,2 Z'
    ].join(' ');
  }

  if (tab === 'outcomes') {
    // 2. OUTCOMES: Dynamic Spatula S-Wave (asymmetric, deep trailing teardrop at x=85 to y=74)
    const mFlow1 = clamp01(morph * 0.95);
    const mFlow2 = clamp01((morph - 0.06) * 1.25);
    const mFlow3 = clamp01((morph - 0.12) * 1.15);

    const w1Y = (yBase + 8 * mFlow1).toFixed(2);
    const neckY = (yBase + 14 * mFlow2).toFixed(2);
    const bulbY = (yBase + 26 * mFlow2).toFixed(2);
    const tipY = (yBase + 35 * mFlow2).toFixed(2);
    const w3Y = (yBase + 10 * mFlow3).toFixed(2);

    return [
      'M 18,2 L 122,2 A 16,16 0 0,1 138,18 A 16,16 0 0,1 122,36',
      // Right edge sweep
      `C 117,36 114,${w3Y} 108,${w3Y}`,
      `C 102,${w3Y} 98,36 94,36`,
      // Long bulbous trailing teardrop at x=85
      `C 91,36 89,${neckY} 88,${neckY}`,
      `C 91,${bulbY} 90,${tipY} 85,${tipY}`,
      `C 80,${tipY} 79,${bulbY} 82,${neckY}`,
      `C 81,${neckY} 78,36 72,36`,
      // High valley & broad left wave
      'C 64,36 58,36 52,36',
      `C 44,36 38,${w1Y} 30,${w1Y}`,
      `C 22,${w1Y} 20,36 18,36`,
      'A 16,16 0 0,1 2,18 A 16,16 0 0,1 18,2 Z'
    ].join(' ');
  }

  if (tab === 'courses') {
    // 3. COURSES: Triple Droplet Cascade (left 60, center 73, right 51)
    const m1 = clamp01((morph - 0.06) * 1.2);
    const m2 = clamp01(morph * 1.15);
    const m3 = clamp01((morph - 0.10) * 1.2);

    const rNeck = (yBase + 6 * m3).toFixed(2);
    const rTip = (yBase + 14 * m3).toFixed(2);

    const cNeck = (yBase + 13 * m2).toFixed(2);
    const cBulb = (yBase + 25 * m2).toFixed(2);
    const cTip = (yBase + 34 * m2).toFixed(2);

    const lNeck = (yBase + 9 * m1).toFixed(2);
    const lTip = (yBase + 22 * m1).toFixed(2);

    return [
      'M 18,2 L 122,2 A 16,16 0 0,1 138,18 A 16,16 0 0,1 122,36',
      // Right droplet (x=108, tip at 51)
      `C 117,36 113,${rNeck} 111,${rNeck}`,
      `C 113,${rTip} 107,${rTip} 105,${rTip}`,
      `C 101,${rTip} 101,${rNeck} 99,${rNeck}`,
      `C 97,${rNeck} 95,36 90,36`,
      // Center deep teardrop (x=71, tip at 73)
      `C 84,36 78,${cNeck} 76,${cNeck}`,
      `C 79,${cBulb} 78,${cTip} 71,${cTip}`,
      `C 64,${cTip} 63,${cBulb} 66,${cNeck}`,
      `C 64,${cNeck} 58,36 52,36`,
      // Left medium droplet (x=33, tip at 60)
      `C 46,36 42,${lNeck} 40,${lNeck}`,
      `C 42,${lTip} 36,${lTip} 33,${lTip}`,
      `C 28,${lTip} 28,${lNeck} 26,${lNeck}`,
      `C 24,${lNeck} 22,36 18,36`,
      'A 16,16 0 0,1 2,18 A 16,16 0 0,1 18,2 Z'
    ].join(' ');
  }

  if (tab === 'includes') {
    // 4. INCLUDES: Heavy Waffle Drip Quartet (4 streams: 50, 68, 52, 67)
    const m1 = clamp01(morph * 1.15);
    const m2 = clamp01((morph - 0.05) * 1.2);
    const m3 = clamp01(morph * 1.15);
    const m4 = clamp01((morph - 0.10) * 1.2);

    const d1 = (yBase + 13 * m1).toFixed(2);
    const d2Neck = (yBase + 12 * m2).toFixed(2);
    const d2Tip = (yBase + 30 * m2).toFixed(2);
    const d3 = (yBase + 15 * m3).toFixed(2);
    const d4Neck = (yBase + 11 * m4).toFixed(2);
    const d4Tip = (yBase + 29 * m4).toFixed(2);

    return [
      'M 18,2 L 122,2 A 16,16 0 0,1 138,18 A 16,16 0 0,1 122,36',
      // Stream 4 (right, tip at 50)
      `C 118,36 116,${d1} 112,${d1}`,
      `C 108,${d1} 106,36 102,36`,
      // Stream 3 (long bulbous teardrop, tip at 68)
      `C 96,36 92,${d2Neck} 90,${d2Neck}`,
      `C 92,${d2Tip} 84,${d2Tip} 82,${d2Tip}`,
      `C 78,${d2Tip} 78,${d2Neck} 76,${d2Neck}`,
      `C 74,${d2Neck} 72,36 68,36`,
      // Stream 2 (medium rounded, tip at 52)
      `C 64,36 60,${d3} 54,${d3}`,
      `C 48,${d3} 46,36 42,36`,
      // Stream 1 (long bulbous teardrop, tip at 67)
      `C 36,36 33,${d4Neck} 31,${d4Neck}`,
      `C 33,${d4Tip} 25,${d4Tip} 23,${d4Tip}`,
      `C 19,${d4Tip} 21,${d4Neck} 20,${d4Neck}`,
      `C 19,${d4Neck} 19,36 18,36`,
      'A 16,16 0 0,1 2,18 A 16,16 0 0,1 18,2 Z'
    ].join(' ');
  }

  // 5. REVIEWS: Deep Twin Teardrops (Twin bulbous drops at x=48 and x=92, high arch)
  const mDroplets = clamp01((morph - 0.04) * 1.2);
  const mArch = clamp01(morph * 1.1);

  const neck = (yBase + 12 * mDroplets).toFixed(2);
  const bulb = (yBase + 23 * mDroplets).toFixed(2);
  const tip = (yBase + 30 * mDroplets).toFixed(2);
  const arch = (yBase + 5 * mArch).toFixed(2);

  return [
    'M 18,2 L 122,2 A 16,16 0 0,1 138,18 A 16,16 0 0,1 122,36',
    'C 116,36 112,36 108,36',
    // Right teardrop at x=92 (tip at 68)
    `C 102,36 98,${neck} 96,${neck}`,
    `C 99,${bulb} 98,${tip} 92,${tip}`,
    `C 86,${tip} 85,${bulb} 88,${neck}`,
    `C 87,${neck} 84,${arch} 70,${arch}`,
    // Left teardrop at x=48 (tip at 68)
    `C 56,${arch} 53,${neck} 54,${neck}`,
    `C 55,${bulb} 54,${tip} 48,${tip}`,
    `C 42,${tip} 41,${bulb} 44,${neck}`,
    `C 42,${neck} 38,36 32,36`,
    'C 26,36 22,36 18,36',
    'A 16,16 0 0,1 2,18 A 16,16 0 0,1 18,2 Z'
  ].join(' ');
}

// Bespoke liquid animation physics per tab
function getTabEasing(tab: TabType, progress: number): number {
  if (progress <= 0) return 0;
  if (progress >= 1) return 1;

  switch (tab) {
    case 'outcomes':
      // Dynamic cascade wave: progressive sweeping flow
      return Math.pow(progress, 1.85) * (1 + 0.10 * Math.sin(progress * Math.PI));
    case 'courses':
      // Triple droplet cascade: crisp rhythmic drops with gentle liquid bounce
      return Math.pow(progress, 2.2) * (1 + 0.13 * Math.sin(progress * Math.PI * 1.5));
    case 'includes':
      // Quad glaze rainfall: bouncy fluid descent
      return Math.pow(progress, 1.9) * (1 + 0.12 * Math.sin(progress * Math.PI));
    case 'reviews':
      // Twin teardrop bloom: voluptuous double swelling curve
      return Math.pow(progress, 2.0) * (1 + 0.11 * Math.sin(progress * Math.PI));
    case 'about':
    default:
      // Signature Hanging Drop: smooth gravity descent with soft relaxation
      return Math.pow(progress, 2.1) * (1 + 0.12 * Math.sin(progress * Math.PI));
  }
}

// Bespoke animation duration per tab
function getTabDuration(tab: TabType): number {
  switch (tab) {
    case 'outcomes': return 340;
    case 'courses':  return 300;
    case 'includes': return 330;
    case 'reviews':  return 310;
    case 'about':
    default:         return 320;
  }
}

export const CreamFlowNav: React.FC<CreamFlowNavProps> = ({
  activeTab,
  onTabChange,
  reviewCount
}) => {
  const navTrackRef = useRef<HTMLElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const indicatorRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  const [mounted, setMounted] = useState<boolean>(false);
  const rafIdRef = useRef<number | null>(null);

  const navItems: { id: TabType; label: string }[] = [
    { id: 'about', label: 'About' },
    { id: 'outcomes', label: 'Outcomes' },
    { id: 'courses', label: 'Courses' },
    { id: 'includes', label: 'Includes' },
    { id: 'reviews', label: `Reviews (${reviewCount})` }
  ];

  // Helper to directly set DOM transform without any sliding across tabs
  const setPosition = useCallback((x: number) => {
    if (indicatorRef.current) {
      indicatorRef.current.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
    }
  }, []);

  const setMorph = useCallback((tab: TabType, morph: number) => {
    if (pathRef.current) {
      pathRef.current.setAttribute('d', getFeatureTabPath(tab, morph));
    }
  }, []);

  /**
   * BESPOKE IN-PLACE LIQUID MELT ANIMATION (ZERO SLIDING ACROSS TABS)
   * The indicator immediately locks onto the selected tab position.
   * Then, in-place only, that specific tab's unique frosting silhouette melts downward.
   */
  const triggerBespokeMelt = useCallback((targetTab: TabType, destX: number) => {
    if (typeof window === 'undefined') return;

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    // Immediately snap position to selected tab (NO sliding over other tabs)
    setPosition(destX);

    const prefersReducedMotion =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setMorph(targetTab, 1);
      return;
    }

    // Melt down in-place: capsule (0) -> unique tab drips (1)
    setMorph(targetTab, 0);
    const startTime = performance.now();
    const duration = getTabDuration(targetTab);

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const morph = getTabEasing(targetTab, progress);
      setMorph(targetTab, morph);

      if (progress < 1) {
        rafIdRef.current = requestAnimationFrame(step);
      } else {
        setMorph(targetTab, 1);
      }
    };

    rafIdRef.current = requestAnimationFrame(step);
  }, [setPosition, setMorph]);

  // Handle activeTab changes
  useEffect(() => {
    const targetBtn = buttonRefs.current[activeTab];
    if (!targetBtn) return;

    const destX = targetBtn.offsetLeft;
    setMounted(true);
    triggerBespokeMelt(activeTab, destX);
  }, [activeTab, triggerBespokeMelt]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const targetBtn = buttonRefs.current[activeTab];
      if (targetBtn) {
        setPosition(targetBtn.offsetLeft);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [activeTab, setPosition]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        background: 'none',
        border: 'none',
        boxShadow: 'none',
        padding: 0,
        margin: 0
      }}
    >
      <nav
        ref={navTrackRef}
        aria-label="Course section navigation"
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '1.25rem',
          padding: '16px 12px 2.5rem 12px',
          overflowX: 'auto',
          overflowY: 'visible',
          whiteSpace: 'nowrap',
          scrollbarWidth: 'none',
          maxWidth: '100%',
          userSelect: 'none',
          background: 'none',
          border: 'none',
          boxShadow: 'none'
        }}
      >
        {/* =========================================================================
            PERSISTENT BESPOKE LIQUID FROSTING INDICATOR
            Zero sliding across tabs, zero rectangular artifacts, distinct per-tab shape
            Ample 16px top padding ensures top rounded capsule is never clipped
            ========================================================================= */}
        <div
          ref={indicatorRef}
          style={{
            position: 'absolute',
            top: '16px',
            left: 0,
            transform: 'translate3d(0, 0, 0)',
            width: `${FROSTING_WIDTH}px`,
            height: `${FROSTING_HEIGHT}px`,
            pointerEvents: 'none',
            zIndex: 1,
            opacity: mounted ? 1 : 0,
            background: 'none',
            border: 'none',
            boxShadow: 'none',
            transition: 'none',
            willChange: 'transform'
          }}
        >
          <svg
            width={FROSTING_WIDTH}
            height={FROSTING_HEIGHT}
            viewBox={`0 0 ${FROSTING_WIDTH} ${FROSTING_HEIGHT}`}
            style={{
              display: 'block',
              background: 'none',
              border: 'none',
              boxShadow: 'none',
              overflow: 'visible',
              filter: 'drop-shadow(0 3px 8px rgba(120, 26, 50, 0.13)) drop-shadow(0 8px 22px rgba(120, 26, 50, 0.08))'
            }}
          >
            {/* Pure white cream body with delicate muted-burgundy outline */}
            <path
              ref={pathRef}
              d={getFeatureTabPath(activeTab, 1)}
              fill="#FFFFFF"
              stroke="rgba(120, 26, 50, 0.18)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* =========================================================================
            FIVE MINIMAL NAVIGATION ITEMS
            Inactive: Plain text only, zero background, consistent muted burgundy
            Active: Bold burgundy typography centered inside the 36px upper capsule
            ========================================================================= */}
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              ref={el => {
                buttonRefs.current[item.id] = el;
              }}
              type="button"
              onClick={() => onTabChange(item.id)}
              style={{
                position: 'relative',
                zIndex: 2,
                background: 'none',
                border: 'none',
                boxShadow: 'none',
                width: `${FROSTING_WIDTH}px`,
                height: '36px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                fontSize: '0.96rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#781A32' : 'rgba(95, 42, 54, 0.72)',
                cursor: 'pointer',
                transition: 'color 0.18s ease, font-weight 0.18s ease',
                outline: 'none',
                whiteSpace: 'nowrap',
                letterSpacing: '0.01em',
                fontFamily: 'inherit',
                padding: 0,
                margin: 0
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <style>{`
        nav::-webkit-scrollbar {
          display: none;
        }
        @media (max-width: 768px) {
          nav[aria-label="Course section navigation"] {
            gap: 0.75rem !important;
          }
        }
      `}</style>
    </div>
  );
};

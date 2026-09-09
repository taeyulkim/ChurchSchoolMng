'use client';

import { useId, useState, type MouseEvent } from 'react';

export interface TrendPoint {
  label: string;
  value: number;
}

interface TrendChartProps {
  data: TrendPoint[];
  color: string;
  height?: number;
  yMax?: number;
  valueSuffix?: string;
  area?: boolean;
  compact?: boolean;
}

const VB_W = 400;

/**
 * 가벼운 SVG 라인/영역 차트. 호버 시 크로스헤어 + 툴팁을 보여줍니다.
 * compact=true면 축 라벨 없이 미니 스파크라인으로 렌더링합니다 (부서별 소형 차트용).
 */
export function TrendChart({ data, color, height = 160, yMax, valueSuffix = '', area = false, compact = false }: TrendChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const gradId = useId();

  const padTop = compact ? 6 : 14;
  const padBottom = compact ? 4 : 24;
  const padX = compact ? 3 : 8;
  const plotW = VB_W - padX * 2;
  const plotH = height - padTop - padBottom;

  const max = yMax ?? Math.max(1, ...data.map((d) => d.value)) * 1.15;

  const xFor = (i: number) => padX + (data.length <= 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const yFor = (v: number) => padTop + plotH - (Math.min(v, max) / max) * plotH;

  const pathD = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(d.value)}`).join(' ');
  const areaD = `${pathD} L ${xFor(data.length - 1)} ${padTop + plotH} L ${xFor(0)} ${padTop + plotH} Z`;

  const handleMove = (e: MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(frac * (data.length - 1));
    setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)));
  };

  const hovered = hoverIdx !== null ? data[hoverIdx] : null;
  const dotSize = compact ? 3 : 4.4;

  return (
    <div className="relative w-full select-none">
      <svg viewBox={`0 0 ${VB_W} ${height}`} width="100%" height={height} preserveAspectRatio="none" className="overflow-visible">
        {area && (
          <>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.28" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaD} fill={`url(#${gradId})`} stroke="none" />
          </>
        )}

        <line x1={padX} y1={padTop + plotH} x2={VB_W - padX} y2={padTop + plotH} stroke="var(--border)" strokeWidth={1} vectorEffect="non-scaling-stroke" />

        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={compact ? 2 : 2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {data.map((d, i) => (
          <rect
            key={i}
            x={xFor(i) - dotSize / 2}
            y={yFor(d.value) - dotSize / 2}
            width={dotSize}
            height={dotSize}
            rx={dotSize / 2}
            fill={i === hoverIdx ? color : 'var(--card)'}
            stroke={color}
            strokeWidth={1.4}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {hoverIdx !== null && (
          <line
            x1={xFor(hoverIdx)}
            y1={padTop}
            x2={xFor(hoverIdx)}
            y2={padTop + plotH}
            stroke={color}
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.5}
            vectorEffect="non-scaling-stroke"
          />
        )}

        {!compact &&
          data.map((d, i) => {
            if (i !== 0 && i !== data.length - 1 && i !== hoverIdx) return null;
            return (
              <text
                key={i}
                x={xFor(i)}
                y={height - 6}
                fontSize={10}
                textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
                fill="var(--muted-foreground)"
              >
                {d.label}
              </text>
            );
          })}

        <rect x={0} y={0} width={VB_W} height={height} fill="transparent" onMouseMove={handleMove} onMouseLeave={() => setHoverIdx(null)} />
      </svg>

      {hovered && hoverIdx !== null && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-sm"
          style={{ left: `${(xFor(hoverIdx) / VB_W) * 100}%` }}
        >
          <span className="font-medium">{hovered.label}</span>
          <span className="ml-1 text-muted-foreground">
            {hovered.value}
            {valueSuffix}
          </span>
        </div>
      )}
    </div>
  );
}

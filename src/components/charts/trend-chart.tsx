'use client';

import { useId, useState, type MouseEvent, type TouchEvent } from 'react';

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

/** 축 눈금이 깔끔한 숫자가 되도록 위쪽으로 반올림합니다 (예: 17 -> 20, 3 -> 5). */
function niceMax(raw: number): number {
  if (raw <= 0) return 1;
  const exponent = Math.floor(Math.log10(raw));
  const magnitude = Math.pow(10, exponent);
  const residual = raw / magnitude;
  let niceResidual: number;
  if (residual <= 1) niceResidual = 1;
  else if (residual <= 2) niceResidual = 2;
  else if (residual <= 5) niceResidual = 5;
  else niceResidual = 10;
  return niceResidual * magnitude;
}

function formatValue(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

/**
 * 가벼운 SVG 라인/영역 차트.
 * - Y축 눈금(0/중간/최고)을 왼쪽에, 마지막 값 뱃지를 그래프 위에 항상 표시해
 *   상호작용 없이도 값을 알 수 있습니다.
 * - Y축 라벨은 플렉스 박스로 배치해 SVG를 반응형으로 비균등 스케일해도 글자가
 *   눌리거나 늘어나지 않습니다.
 * - 마우스 호버와 터치 모두 크로스헤어 + 툴팁을 지원합니다.
 * - compact=true면 미니 스파크라인으로 렌더링합니다 (부서별 소형 차트용).
 */
export function TrendChart({ data, color, height = 160, yMax, valueSuffix = '', area = false, compact = false }: TrendChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const gradId = useId();

  const rawMax = yMax ?? Math.max(1, ...data.map((d) => d.value));
  const axisMax = valueSuffix === '%' ? 100 : niceMax(rawMax);

  const padTop = compact ? 10 : 16;
  const padBottom = compact ? 2 : 18;
  const padX = compact ? 4 : 6;
  const plotW = VB_W - padX * 2;
  const plotH = height - padTop - padBottom;

  const xFor = (i: number) => padX + (data.length <= 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const yFor = (v: number) => padTop + plotH - (Math.min(v, axisMax) / axisMax) * plotH;
  const xPct = (i: number) => (xFor(i) / VB_W) * 100;

  const pathD = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(d.value)}`).join(' ');
  const areaD = `${pathD} L ${xFor(data.length - 1)} ${padTop + plotH} L ${xFor(0)} ${padTop + plotH} Z`;

  const updateFromClientX = (clientX: number, rect: DOMRect) => {
    const frac = (clientX - rect.left) / rect.width;
    const idx = Math.round(frac * (data.length - 1));
    setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)));
  };

  const handleMouseMove = (e: MouseEvent<SVGRectElement>) => {
    updateFromClientX(e.clientX, e.currentTarget.getBoundingClientRect());
  };

  const handleTouch = (e: TouchEvent<SVGRectElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    updateFromClientX(touch.clientX, e.currentTarget.getBoundingClientRect());
  };

  const hovered = hoverIdx !== null ? data[hoverIdx] : null;
  const dotSize = compact ? 3 : 4.4;

  const lastIdx = data.length - 1;
  const lastPoint = data[lastIdx];
  const showLatestBadge = lastPoint !== undefined && hoverIdx === null;
  const badgeText = lastPoint ? `${formatValue(lastPoint.value)}${valueSuffix}` : '';
  const badgeTopPct = lastPoint ? (yFor(lastPoint.value) / height) * 100 : 0;

  // 표시 순서: 위쪽(최고값)부터 아래쪽(0)까지 - flex column과 순서를 맞춥니다.
  const gridValuesTopDown = compact ? [axisMax] : [axisMax, axisMax / 2, 0];
  const leftGutter = compact ? 22 : 30;

  return (
    <div className="flex w-full" style={{ height }}>
      {/* Y축 눈금 라벨: 플렉스 배치라 SVG 스케일과 무관하게 항상 또렷합니다 */}
      <div
        className="flex shrink-0 flex-col items-end text-muted-foreground"
        style={{ width: leftGutter, paddingTop: padTop, paddingBottom: padBottom, justifyContent: compact ? 'flex-start' : 'space-between' }}
      >
        {gridValuesTopDown.map((v) => (
          <span key={v} className="whitespace-nowrap leading-none" style={{ fontSize: compact ? 8 : 10 }}>
            {formatValue(v)}
            {valueSuffix}
          </span>
        ))}
      </div>

      <div className="relative min-w-0 flex-1 select-none">
        <svg viewBox={`0 0 ${VB_W} ${height}`} width="100%" height={height} preserveAspectRatio="none" className="absolute inset-0 overflow-visible">
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

          {gridValuesTopDown.map((v) => (
            <line
              key={v}
              x1={0}
              y1={yFor(v)}
              x2={VB_W}
              y2={yFor(v)}
              stroke="var(--border)"
              strokeOpacity={v === 0 ? 1 : 0.5}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}

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

          <rect
            x={0}
            y={0}
            width={VB_W}
            height={height}
            fill="transparent"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverIdx(null)}
            onTouchStart={handleTouch}
            onTouchMove={handleTouch}
            onTouchEnd={() => setHoverIdx(null)}
          />
        </svg>

        {/* 마지막(최신) 값 뱃지 - 상호작용 없이도 현재 값을 보여줍니다 */}
        {showLatestBadge && lastPoint && (
          <span
            className="pointer-events-none absolute -translate-x-full -translate-y-full whitespace-nowrap rounded-full px-1.5 py-0.5 font-bold text-white"
            style={{
              left: `${xPct(lastIdx)}%`,
              top: `${badgeTopPct}%`,
              marginTop: -6,
              marginLeft: 4,
              fontSize: compact ? 8 : 10,
              backgroundColor: color,
            }}
          >
            {badgeText}
          </span>
        )}

        {/* X축 라벨 (양 끝 + 호버 시 해당 라벨) */}
        {!compact &&
          data.map((d, i) => {
            if (i !== 0 && i !== data.length - 1 && i !== hoverIdx) return null;
            return (
              <span
                key={i}
                className="pointer-events-none absolute bottom-0 whitespace-nowrap text-[10px] text-muted-foreground"
                style={{
                  left: `${xPct(i)}%`,
                  transform: i === 0 ? 'translateX(0)' : i === data.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)',
                }}
              >
                {d.label}
              </span>
            );
          })}

        {hovered && hoverIdx !== null && (
          <div
            className="pointer-events-none absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-sm"
            style={{ left: `${xPct(hoverIdx)}%` }}
          >
            <span className="font-medium">{hovered.label}</span>
            <span className="ml-1 text-muted-foreground">
              {formatValue(hovered.value)}
              {valueSuffix}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

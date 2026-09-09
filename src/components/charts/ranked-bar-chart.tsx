export interface RankedBarItem {
  label: string;
  sublabel?: string;
  value: number;
}

interface RankedBarChartProps {
  data: RankedBarItem[];
  color: string;
  valueSuffix?: string;
}

/**
 * 순위가 있는 항목을 가로 막대로 보여주는 간단한 차트 (예: 학생별 달란트 순위).
 */
export function RankedBarChart({ data, color, valueSuffix = '' }: RankedBarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));

  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">표시할 데이터가 없습니다.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {data.map((d, i) => (
        <div key={`${d.label}-${i}`} className="flex items-center gap-3">
          <div className="w-5 shrink-0 text-right text-xs font-semibold text-muted-foreground tabular-nums">{i + 1}</div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-medium">{d.label}</span>
              {d.sublabel && <span className="shrink-0 text-xs text-muted-foreground">{d.sublabel}</span>}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(4, (d.value / max) * 100)}%`, backgroundColor: color }}
              />
            </div>
          </div>
          <div className="w-16 shrink-0 text-right text-sm font-semibold tabular-nums">
            {d.value.toLocaleString()}
            {valueSuffix}
          </div>
        </div>
      ))}
    </div>
  );
}

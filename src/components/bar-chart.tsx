type BarChartProps = {
  items: Array<Record<string, string | number>>;
  valueKey: string;
  labelKey: string;
  formatValue: (value: number) => string;
  colorClassName: string;
  maxValue?: number;
};

export function BarChart({
  items,
  valueKey,
  labelKey,
  formatValue,
  colorClassName,
  maxValue,
}: BarChartProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500">表示するデータがありません</p>
    );
  }

  const resolvedMaxValue =
    maxValue ??
    Math.max(...items.map((item) => Number(item[valueKey])), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const value = Number(item[valueKey]);
        const widthPercent = Math.max((value / resolvedMaxValue) * 100, 4);

        return (
          <div key={String(item[labelKey])}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-slate-600 dark:text-slate-400">
                {item[labelKey]}
              </span>
              <span className="shrink-0 font-medium text-slate-800 dark:text-slate-200">
                {formatValue(value)}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div
                className={`h-full rounded-full ${colorClassName}`}
                style={{ width: `${widthPercent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

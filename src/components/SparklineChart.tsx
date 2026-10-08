interface SparklineChartProps {
  values: number[];
  labels?: string[];
  color?: string;
  height?: number;
}

export function SparklineChart({
  values,
  labels,
  color = 'var(--app-accent)',
  height = 72,
}: SparklineChartProps) {
  if (values.length === 0) {
    return null;
  }

  const width = 320;
  const padding = 8;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const points = values.map((value, index) => {
    const x =
      values.length === 1
        ? width / 2
        : padding + (index / (values.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / span) * (height - padding * 2);
    return { x, y, value };
  });

  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');

  return (
    <div className="sparkline">
      <svg viewBox={`0 0 ${width} ${height}`} className="sparkline-svg" role="img">
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        {points.map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r="3" fill={color} />
        ))}
      </svg>
      {labels && labels.length > 0 && (
        <div className="sparkline-labels">
          <span>{labels[0]}</span>
          {labels.length > 1 && <span>{labels[labels.length - 1]}</span>}
        </div>
      )}
    </div>
  );
}

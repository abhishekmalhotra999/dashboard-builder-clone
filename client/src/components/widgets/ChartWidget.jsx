import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { generateDefaultData } from '../../utils/chartData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const THEMES = {
  blue:   { primary: 'rgba(59,130,246,0.75)',  border: 'rgba(59,130,246,1)',   fill: 'rgba(59,130,246,0.12)' },
  purple: { primary: 'rgba(124,58,237,0.75)',  border: 'rgba(124,58,237,1)',   fill: 'rgba(124,58,237,0.12)' },
  green:  { primary: 'rgba(16,185,129,0.75)',  border: 'rgba(16,185,129,1)',   fill: 'rgba(16,185,129,0.12)' },
  orange: { primary: 'rgba(245,158,11,0.75)',  border: 'rgba(245,158,11,1)',   fill: 'rgba(245,158,11,0.12)' },
  red:    { primary: 'rgba(239,68,68,0.75)',   border: 'rgba(239,68,68,1)',    fill: 'rgba(239,68,68,0.12)'  },
};

function ChartWidget({ widget }) {
  const { chartType = 'bar', title = 'Chart', theme = 'blue', customData, yAxisLabel = '', showLegend = false } = widget.content;

  // Stable reference — only changes when theme changes
  const colors = useMemo(() => THEMES[theme] || THEMES.blue, [theme]);

  // Stable reference — only changes when customData or widget.id changes
  const resolvedData = useMemo(
    () => customData || generateDefaultData(widget.id),
    [customData, widget.id]
  );

  const data = useMemo(() => ({
    labels: resolvedData.labels,
    datasets: [
      {
        label: title,
        data: resolvedData.values,
        backgroundColor: chartType === 'line' ? colors.fill : colors.primary,
        borderColor: colors.border,
        borderWidth: 2,
        fill: chartType === 'line',
        tension: 0.4,
        pointRadius: chartType === 'line' ? 4 : 0,
        pointHoverRadius: 6,
        borderRadius: chartType === 'bar' ? 4 : 0,
      },
    ],
  }), [resolvedData, chartType, title, colors]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: Boolean(showLegend) },
      title: {
        display: Boolean(title),
        text: title,
        font: { size: 13, weight: 'bold' },
        color: '#374151',
        padding: { bottom: 8 },
      },
      tooltip: {
        backgroundColor: 'rgba(17,24,39,0.85)',
        titleColor: '#fff',
        bodyColor: '#e5e7eb',
        padding: 10,
        cornerRadius: 6,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: '#6b7280' },
      },
      y: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { font: { size: 11 }, color: '#6b7280' },
        beginAtZero: true,
        title: {
          display: Boolean(yAxisLabel),
          text: yAxisLabel,
          color: '#6b7280',
          font: { size: 11 },
        },
      },
    },
  }), [title, yAxisLabel, showLegend]);

  const ChartComponent = chartType === 'line' ? Line : Bar;

  return (
    <div className="chart-widget">
      <ChartComponent data={data} options={options} />
    </div>
  );
}

export default ChartWidget;

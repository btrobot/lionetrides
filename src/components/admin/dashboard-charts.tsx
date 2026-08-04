'use client';

import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart as RechartsArea,
} from 'recharts';

// ─── Color Palette ──────────────────────────────────────
const COLORS = {
  blue: '#2563eb',
  orange: '#f97316',
  green: '#22c55e',
  purple: '#a855f7',
  rose: '#e11d48',
  teal: '#14b8a6',
  yellow: '#eab308',
  indigo: '#6366f1',
  gray: '#6b7280',
};

const STATUS_COLORS: Record<string, string> = {
  draft: '#9ca3af',
  published: '#22c55e',
  archived: '#6b7280',
  pending: '#eab308',
  processing: '#2563eb',
  replied: '#22c55e',
  closed: '#6b7280',
  customer: '#2563eb',
  admin: '#f97316',
  editor: '#a855f7',
  viewer: '#6b7280',
  super_admin: '#e11d48',
};

const PIE_COLORS = [
  COLORS.blue, COLORS.orange, COLORS.green, COLORS.purple,
  COLORS.rose, COLORS.teal, COLORS.yellow, COLORS.indigo, COLORS.gray,
];

// ─── Custom Tooltip ─────────────────────────────────────
interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-100 text-sm">
      <p className="font-medium text-gray-900 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="text-xs">
          {p.name}: <span className="font-medium">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Bar Chart ──────────────────────────────────────────
interface BarChartProps {
  data: { month: string; count: number }[];
  title: string;
  color?: string;
  height?: number;
}

export function BarChart({ data, title, color = COLORS.blue, height = 280 }: BarChartProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-900 mb-4 text-sm">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBar data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} maxBarSize={40} />
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Area Chart ─────────────────────────────────────────
interface AreaChartProps {
  data: { month: string; count: number }[];
  title: string;
  color?: string;
  height?: number;
}

export function AreaChart({ data, title, color = COLORS.blue, height = 280 }: AreaChartProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-900 mb-4 text-sm">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsArea data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke={color}
            strokeWidth={2}
            fill={`url(#gradient-${title})`}
          />
        </RechartsArea>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Pie Chart ──────────────────────────────────────────
interface PieChartProps {
  data: { name: string; value: number }[];
  title: string;
  height?: number;
}

export function PieChart({ data, title, height = 280 }: PieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-900 mb-4 text-sm">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPie>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string) => (
              <span className="text-xs text-gray-600">{value}</span>
            )}
          />
        </RechartsPie>
      </ResponsiveContainer>
      {data.length > 0 && (
        <div className="text-center mt-1">
          <span className="text-xs text-gray-400">总计 {total} 条</span>
        </div>
      )}
    </div>
  );
}

// ─── Horizontal Bar Chart ───────────────────────────────
interface HorizontalBarProps {
  data: { name: string; count: number }[];
  title: string;
  color?: string;
  height?: number;
}

export function HorizontalBarChart({ data, title, color = COLORS.orange, height = 300 }: HorizontalBarProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-900 mb-4 text-sm">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBar
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" fill={color} radius={[0, 4, 4, 0]} maxBarSize={20} />
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Status Donut (compact) ─────────────────────────────
interface StatusDonutProps {
  data: { status: string; count: number }[];
  title: string;
  height?: number;
}

export function StatusDonut({ data, title, height = 200 }: StatusDonutProps) {
  const chartData = data.map((d) => ({
    name: d.status,
    value: d.count,
    color: STATUS_COLORS[d.status] || COLORS.gray,
  }));
  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-900 mb-3 text-sm">{title}</h3>
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <ResponsiveContainer width={140} height={height}>
            <RechartsPie>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                dataKey="value"
              >
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
            </RechartsPie>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          {chartData.map((d) => (
            <div key={d.name} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-gray-600">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: d.color }}
                />
                {d.name}
              </span>
              <span className="font-medium text-gray-900">
                {d.value}
                <span className="text-gray-400 ml-1">
                  ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Activity Timeline ──────────────────────────────────
interface ActivityItem {
  id: number;
  inquiryNo: string;
  contactName: string;
  companyName: string | null;
  status: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-800' },
  processing: { label: '处理中', color: 'bg-blue-100 text-blue-800' },
  replied: { label: '已回复', color: 'bg-green-100 text-green-800' },
  closed: { label: '已关闭', color: 'bg-gray-100 text-gray-600' },
};

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-sm">实时动态</h3>
      </div>
      <div className="p-4 max-h-[360px] overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">暂无动态</p>
        ) : (
          <div className="space-y-0">
            {items.map((item, i) => {
              const statusInfo = STATUS_LABELS[item.status] || { label: item.status, color: 'bg-gray-100 text-gray-600' };
              const isLast = i === items.length - 1;
              return (
                <div key={item.id} className="relative flex gap-3 pb-4">
                  {/* Timeline line */}
                  {!isLast && (
                    <div className="absolute left-[11px] top-6 bottom-0 w-px bg-gray-200" />
                  )}
                  {/* Dot */}
                  <div className="relative flex-shrink-0 mt-1">
                    <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center ring-4 ring-white ${statusInfo.color}`}>
                      <span className="text-[10px] font-bold">●</span>
                    </div>
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900">
                        {item.companyName || item.contactName}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.inquiryNo} · {item.contactName}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {new Date(item.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  href: string;
  loading?: boolean;
}

export function StatCard({ label, value, icon: Icon, color, bg, href, loading }: StatCardProps) {
  return (
    <a href={href} className="relative overflow-hidden rounded-xl p-5 text-white shadow-sm hover:shadow-md transition-shadow block group"
       style={{ background: bg || 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}>
      {/* 装饰性背景图标 */}
      <div className="absolute right-3 top-3 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon className="h-16 w-16" />
      </div>
      <div className="relative">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-white/20 p-2.5 rounded-lg backdrop-blur-sm group-hover:scale-110 transition-transform">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="text-2xl font-bold mb-0.5">
          {loading ? (
            <span className="inline-block w-10 h-7 bg-white/20 rounded animate-pulse" />
          ) : (
            value
          )}
        </p>
        <p className="text-sm text-white/80">{label}</p>
      </div>
    </a>
  );
}
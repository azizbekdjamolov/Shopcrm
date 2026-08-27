import {
  LineChart as ReLineChart,
  BarChart as ReBarChart,
  PieChart as RePieChart,
  Line,
  Bar,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface ChartDataPoint {
  [key: string]: string | number
}

interface BaseChartProps {
  data: ChartDataPoint[]
  className?: string
}

interface LineChartProps extends BaseChartProps {
  xKey: string
  yKey: string
  color?: string
  height?: number
}

function LineChartComponent({ data, xKey, yKey, color = '#3b82f6', height = 300 }: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis dataKey={xKey} className="text-xs" stroke="#9ca3af" />
        <YAxis className="text-xs" stroke="#9ca3af" />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Line type="monotone" dataKey={yKey} stroke={color} strokeWidth={2} dot={{ r: 4 }} />
      </ReLineChart>
    </ResponsiveContainer>
  )
}

interface BarChartProps extends BaseChartProps {
  xKey: string
  yKey: string
  color?: string
  height?: number
}

function BarChartComponent({ data, xKey, yKey, color = '#3b82f6', height = 300 }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis dataKey={xKey} className="text-xs" stroke="#9ca3af" />
        <YAxis className="text-xs" stroke="#9ca3af" />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
      </ReBarChart>
    </ResponsiveContainer>
  )
}

interface PieChartProps {
  data: ChartDataPoint[]
  nameKey: string
  valueKey: string
  height?: number
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

function PieChartComponent({ data, nameKey, valueKey, height = 300 }: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RePieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={4}
          dataKey={valueKey}
          nameKey={nameKey}
        >
          {data.map((_, index) => (
            <Pie key={index} dataKey={valueKey} data={data} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Legend />
      </RePieChart>
    </ResponsiveContainer>
  )
}

export { LineChartComponent as LineChart, BarChartComponent as BarChart, PieChartComponent as PieChart }

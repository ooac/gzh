'use client'

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { ScatterData } from '@/types'

interface EngagementRateScatterProps {
  data: ScatterData[]
}

export default function EngagementRateScatter({ data }: EngagementRateScatterProps) {
  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
    return value.toString()
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card p-3 border border-border rounded-lg shadow-lg">
          <p className="font-medium text-foreground mb-2">{data.title}</p>
          <p className="text-sm text-muted-foreground mb-1">作者: {data.author}</p>
          <p className="text-sm text-primary mb-1">阅读量: {formatNumber(data.x)}</p>
          <p className="text-sm text-primary">互动率: {data.y.toFixed(2)}%</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full h-80 min-h-[320px]">
      <ResponsiveContainer width="100%" height={320} minWidth={300}>
        <ScatterChart
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            dataKey="x"
            name="阅读量"
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={formatNumber}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="互动率"
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Scatter
            name="文章互动率"
            data={data}
            fill="#8B5CF6"
            shape={({ cx, cy }: { cx: number; cy: number }) => (
              <circle cx={cx} cy={cy} r={6} fill="hsl(var(--primary))" fillOpacity={0.8} stroke="hsl(var(--background))" strokeWidth={1} />
            )}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
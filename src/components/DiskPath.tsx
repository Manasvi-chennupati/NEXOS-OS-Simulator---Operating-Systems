import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DiskResult } from '../algorithms/types'

export function DiskPath({ result }: { result: DiskResult }) {
  const data = [{ step: 0, cylinder: result.startHead }, ...result.sequence.map((cylinder, i) => ({ step: i + 1, cylinder }))]
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="step" stroke="#64748b" />
          <YAxis domain={[0, result.maxCylinder]} stroke="#64748b" />
          <Tooltip
            contentStyle={{ background: '#0b1220', border: '1px solid #1e293b' }}
            labelFormatter={(s) => `Step ${s}`}
          />
          <Line type="linear" dataKey="cylinder" stroke="#3ee0c2" dot strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

import { useMemo } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import { Users, Wallet, ArrowLeftRight } from 'lucide-react'
import members from '../data/members'
import accounts from '../data/accounts'
import transactions from '../data/transactions'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtCurrency(val) {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`
  if (val >= 1_000)     return `$${(val / 1_000).toFixed(0)}K`
  return `$${val.toFixed(0)}`
}

function TrendBadge({ pct, label }) {
  const up = pct >= 0
  return (
    <span className={`text-xs font-medium ${up ? 'text-emerald-600' : 'text-red-500'}`}>
      {up ? '↑' : '↓'} {Math.abs(pct)}% {label}
    </span>
  )
}

function StatCard({ icon: Icon, iconBg, label, value, pct, trendLabel }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon size={20} className="text-white" />
        </div>
        <TrendBadge pct={pct} label={trendLabel} />
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  )
}

export default function Dashboard() {
  const totalAUM = useMemo(() => accounts.reduce((sum, a) => sum + a.balance, 0), [])

  const txByMonth = useMemo(() => {
    const map = {}
    transactions.forEach(tx => {
      const key = tx.date.slice(0, 7)
      if (!map[key]) map[key] = { count: 0, netFlow: 0 }
      map[key].count++
      map[key].netFlow += tx.type === 'Credit' ? tx.amount : -tx.amount
    })
    return map
  }, [])

  const monthSlots = useMemo(() => {
    const slots = []
    let y = 2025, m = 0
    for (let i = 0; i < 14; i++) {
      slots.push({
        key:   `${y}-${String(m + 1).padStart(2, '0')}`,
        label: `${MONTH_NAMES[m]} '${String(y).slice(2)}`,
      })
      if (++m === 12) { m = 0; y++ }
    }
    return slots
  }, [])

  const aumHistory = useMemo(() => {
    const result = new Array(14)
    result[13] = totalAUM
    for (let i = 12; i >= 0; i--) {
      const delta = txByMonth[monthSlots[i + 1].key]?.netFlow ?? 0
      result[i] = result[i + 1] - delta
    }
    return result.map(v => Math.max(0, Math.round(v)))
  }, [totalAUM, txByMonth, monthSlots])

  const txCounts = useMemo(
    () => monthSlots.map(s => txByMonth[s.key]?.count ?? 0),
    [monthSlots, txByMonth],
  )

  const txFeb       = txByMonth['2026-02']?.count ?? 0
  const txJan       = txByMonth['2026-01']?.count ?? 0
  const txTrendPct  = txJan > 0 ? Math.round(((txFeb - txJan) / txJan) * 100) : 0

  const aumTrendPct = aumHistory[12] > 0
    ? Math.round(((aumHistory[13] - aumHistory[12]) / aumHistory[12]) * 100)
    : 0

  const joiners2025    = members.filter(m => m.joinedDate.startsWith('2025')).length
  const joiners2024    = members.filter(m => m.joinedDate.startsWith('2024')).length
  const memberTrendPct = joiners2024 > 0
    ? Math.round(((joiners2025 - joiners2024) / joiners2024) * 100)
    : 0

  const aumChartOptions = useMemo(() => ({
    chart: {
      type: 'area',
      height: 230,
      backgroundColor: 'transparent',
      style: { fontFamily: 'inherit' },
      margin: [10, 10, 40, 72],
    },
    title:   { text: null },
    credits: { enabled: false },
    xAxis: {
      categories: monthSlots.map(s => s.label),
      labels:     { style: { fontSize: '10px', color: '#94a3b8' } },
      lineColor:  '#e2e8f0',
      tickColor:  'transparent',
    },
    yAxis: {
      title:         { text: null },
      labels:        { formatter() { return fmtCurrency(this.value) }, style: { fontSize: '10px', color: '#94a3b8' } },
      gridLineColor: '#f1f5f9',
    },
    tooltip: {
      formatter() { return `<b>${this.x}</b><br/>Assets: <b>${fmtCurrency(this.y)}</b>` },
    },
    series: [{
      name:      'Total Assets',
      data:      aumHistory,
      color:     '#d4a843',
      fillColor: {
        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
        stops: [[0, 'rgba(212,168,67,0.25)'], [1, 'rgba(212,168,67,0)']],
      },
      lineWidth: 2,
      marker:    { enabled: false, states: { hover: { enabled: true, radius: 4 } } },
    }],
    legend: { enabled: false },
  }), [aumHistory, monthSlots])

  const txChartOptions = useMemo(() => ({
    chart: {
      type: 'column',
      height: 230,
      backgroundColor: 'transparent',
      style: { fontFamily: 'inherit' },
      margin: [10, 10, 40, 42],
    },
    title:   { text: null },
    credits: { enabled: false },
    xAxis: {
      categories: monthSlots.map(s => s.label),
      labels:     { style: { fontSize: '10px', color: '#94a3b8' } },
      lineColor:  '#e2e8f0',
      tickColor:  'transparent',
    },
    yAxis: {
      title:         { text: null },
      labels:        { style: { fontSize: '10px', color: '#94a3b8' } },
      gridLineColor: '#f1f5f9',
      allowDecimals: false,
    },
    tooltip: { pointFormat: '<b>{point.y}</b> transactions' },
    series: [{
      name:        'Transactions',
      data:        txCounts,
      color:       '#0d1b2a',
      borderRadius: 3,
      borderWidth:  0,
    }],
    legend: { enabled: false },
  }), [txCounts, monthSlots])

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          iconBg="bg-navy-800"
          label="Total Members"
          value={members.length}
          pct={memberTrendPct}
          trendLabel="vs 2024 joiners"
        />
        <StatCard
          icon={Wallet}
          iconBg="bg-navy-700"
          label="Total Assets"
          value={fmtCurrency(totalAUM)}
          pct={aumTrendPct}
          trendLabel="vs Jan 2026"
        />
        <StatCard
          icon={ArrowLeftRight}
          iconBg="bg-navy-600"
          label="Transactions — Feb 2026"
          value={txFeb}
          pct={txTrendPct}
          trendLabel="vs Jan 2026"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <p className="text-sm font-semibold text-slate-700">Total Assets — 14 Month Trend</p>
          <p className="text-xs text-slate-400 mt-0.5 mb-4">Jan 2025 – Feb 2026</p>
          <HighchartsReact highcharts={Highcharts} options={aumChartOptions} />
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <p className="text-sm font-semibold text-slate-700">Transaction Volume by Month</p>
          <p className="text-xs text-slate-400 mt-0.5 mb-4">Jan 2025 – Feb 2026</p>
          <HighchartsReact highcharts={Highcharts} options={txChartOptions} />
        </div>
      </div>

    </div>
  )
}

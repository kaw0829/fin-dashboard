import { useState, useMemo } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import { Plus, X } from 'lucide-react'
import members from '../data/members'
import accounts from '../data/accounts'
import transactions from '../data/transactions'

// ── Constants ────────────────────────────────────────────────────────────────

const TODAY = new Date('2026-03-06')

const SEGMENT_DIMENSIONS = [
  { key: 'accountType', label: 'Account Type' },
  { key: 'kycStatus',   label: 'KYC Status' },
  { key: 'status',      label: 'Member Status' },
  { key: 'balanceTier', label: 'Balance Tier' },
  { key: 'joinYear',    label: 'Join Year' },
]

const BALANCE_TIER_ORDER = ['Under $5K', '$5K–$25K', '$25K–$100K', 'Over $100K']

const BUCKET_METRICS = [
  { key: 'count',         label: 'Member Count' },
  { key: 'avgBalance',    label: 'Avg Balance' },
  { key: 'avgMembership', label: 'Avg Tenure (yrs)' },
  { key: 'avgTxVolume',   label: 'Avg Tx Volume' },
]

const SEGMENT_METRICS = [
  { key: 'count',         label: 'Member Count' },
  { key: 'avgBalance',    label: 'Avg Balance' },
  { key: 'avgMembership', label: 'Avg Tenure (yrs)' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAge(dob) {
  const birth = new Date(dob)
  let age = TODAY.getFullYear() - birth.getFullYear()
  const m = TODAY.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && TODAY.getDate() < birth.getDate())) age--
  return age
}

function getMembershipYears(joinedDate) {
  return (TODAY - new Date(joinedDate)) / (1000 * 60 * 60 * 24 * 365.25)
}

function avg(arr) {
  return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0
}

function fmtCurrency(val) {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`
  if (val >= 1_000)     return `$${(val / 1_000).toFixed(1)}K`
  return `$${val.toFixed(0)}`
}

function fmtYears(val) {
  return `${val.toFixed(1)} yrs`
}

// ── Pre-compute per-member aggregates (module-level, runs once) ───────────────

const memberBalances = {}
accounts.forEach(a => {
  memberBalances[a.memberId] = (memberBalances[a.memberId] ?? 0) + a.balance
})

const memberTxVolume = {}
transactions.forEach(tx => {
  memberTxVolume[tx.memberId] = (memberTxVolume[tx.memberId] ?? 0) + tx.amount
})

const enriched = members.map(m => ({
  ...m,
  age:            getAge(m.dob),
  membershipYears: getMembershipYears(m.joinedDate),
  totalBalance:   memberBalances[m.id] ?? 0,
  totalTxVolume:  memberTxVolume[m.id] ?? 0,
  joinYear:       m.joinedDate.slice(0, 4),
  balanceTier: (() => {
    const b = memberBalances[m.id] ?? 0
    if (b < 5_000)   return 'Under $5K'
    if (b < 25_000)  return '$5K–$25K'
    if (b < 100_000) return '$25K–$100K'
    return 'Over $100K'
  })(),
}))

// ── Computation functions ─────────────────────────────────────────────────────

function computeBuckets(boundaries) {
  return boundaries.slice(0, -1).map((lo, i) => {
    const hi    = boundaries[i + 1]
    const group = enriched.filter(m => m.age >= lo && m.age < hi)
    return {
      label:         `${lo}–${hi - 1}`,
      count:         group.length,
      avgBalance:    avg(group.map(m => m.totalBalance)),
      avgMembership: avg(group.map(m => m.membershipYears)),
      avgTxVolume:   avg(group.map(m => m.totalTxVolume)),
    }
  })
}

function computeSegments(dimension) {
  const groups = {}
  enriched.forEach(m => {
    const k = String(m[dimension])
    if (!groups[k]) groups[k] = []
    groups[k].push(m)
  })
  let keys = Object.keys(groups)
  if (dimension === 'balanceTier') keys = BALANCE_TIER_ORDER.filter(k => keys.includes(k))
  else                             keys = keys.sort()
  return keys.map(k => ({
    segment:       k,
    count:         groups[k].length,
    avgBalance:    avg(groups[k].map(m => m.totalBalance)),
    avgMembership: avg(groups[k].map(m => m.membershipYears)),
  }))
}

// ── Shared chart defaults ─────────────────────────────────────────────────────

function columnChart(categories, data, color, height = 250) {
  return {
    chart:   { type: 'column', height, backgroundColor: 'transparent', style: { fontFamily: 'inherit' }, margin: [10, 10, 40, 52] },
    title:   { text: null },
    credits: { enabled: false },
    xAxis:   { categories, labels: { style: { fontSize: '10px', color: '#94a3b8' } }, lineColor: '#e2e8f0', tickColor: 'transparent' },
    yAxis:   { title: { text: null }, labels: { style: { fontSize: '10px', color: '#94a3b8' } }, gridLineColor: '#f1f5f9' },
    legend:  { enabled: false },
    series:  [{ data, color, borderRadius: 4, borderWidth: 0 }],
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Analytics() {

  // ── Age bucket state ─────────────────────────────────────────────────
  const [boundaries, setBoundaries] = useState([18, 26, 36, 51, 66, 81])

  const buckets     = useMemo(() => computeBuckets(boundaries), [boundaries])
  const bucketCount = buckets.length

  function addBucket() {
    let maxGap = 0, splitIdx = 0
    for (let i = 0; i < boundaries.length - 1; i++) {
      const gap = boundaries[i + 1] - boundaries[i]
      if (gap > maxGap) { maxGap = gap; splitIdx = i }
    }
    const mid = Math.round((boundaries[splitIdx] + boundaries[splitIdx + 1]) / 2)
    if (mid <= boundaries[splitIdx] || mid >= boundaries[splitIdx + 1]) return
    const next = [...boundaries]
    next.splice(splitIdx + 1, 0, mid)
    setBoundaries(next)
  }

  function removeBoundary(innerIdx) {
    // innerIdx is index within boundaries.slice(1,-1), so actual index = innerIdx + 1
    if (bucketCount <= 2) return
    setBoundaries(prev => prev.filter((_, i) => i !== innerIdx + 1))
  }

  function updateBoundary(innerIdx, raw) {
    const val      = parseInt(raw)
    const arrayIdx = innerIdx + 1
    if (isNaN(val)) return
    const clamped  = Math.max(boundaries[arrayIdx - 1] + 1, Math.min(boundaries[arrayIdx + 1] - 1, val))
    setBoundaries(prev => prev.map((b, i) => (i === arrayIdx ? clamped : b)))
  }

  // ── Bucket chart metric ───────────────────────────────────────────────
  const [bucketMetric, setBucketMetric] = useState('count')

  const bucketChartOptions = useMemo(() => {
    const tooltipFmt = {
      count:         v => `${v} members`,
      avgBalance:    v => fmtCurrency(v),
      avgMembership: v => fmtYears(v),
      avgTxVolume:   v => fmtCurrency(v),
    }
    const raw = buckets.map(b => {
      const v = b[bucketMetric]
      return bucketMetric === 'count' ? v : parseFloat(v.toFixed(2))
    })
    const opts = columnChart(buckets.map(b => b.label), raw, '#d4a843')
    opts.tooltip = { formatter() { return `<b>${this.x}</b><br/>${tooltipFmt[bucketMetric](this.y)}` } }
    opts.yAxis.allowDecimals = bucketMetric === 'avgMembership'
    return opts
  }, [buckets, bucketMetric])

  // ── Segmentation state ────────────────────────────────────────────────
  const [segmentDim, setSegmentDim]       = useState('accountType')
  const [segmentMetric, setSegmentMetric] = useState('count')

  const segments = useMemo(() => computeSegments(segmentDim), [segmentDim])

  const segmentChartOptions = useMemo(() => {
    const tooltipFmt = {
      count:         v => `${v} members`,
      avgBalance:    v => fmtCurrency(v),
      avgMembership: v => fmtYears(v),
    }
    const raw = segments.map(s => {
      const v = s[segmentMetric]
      return segmentMetric === 'count' ? v : parseFloat(v.toFixed(2))
    })
    const opts = columnChart(segments.map(s => s.segment), raw, '#0d1b2a')
    opts.tooltip = { formatter() { return `<b>${this.x}</b><br/>${tooltipFmt[segmentMetric](this.y)}` } }
    opts.yAxis.allowDecimals = segmentMetric === 'avgMembership'
    return opts
  }, [segments, segmentMetric])

  // ── Portfolio distribution ─────────────────────────────────────────────
  const aumByType = useMemo(() => {
    const map = { Standard: 0, Premium: 0, Business: 0 }
    members.forEach(m => { map[m.accountType] = (map[m.accountType] ?? 0) + (memberBalances[m.id] ?? 0) })
    return map
  }, [])

  const membersByJoinYear = useMemo(() => {
    const map = {}
    members.forEach(m => { const y = m.joinedDate.slice(0, 4); map[y] = (map[y] ?? 0) + 1 })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [])

  const totalAUM = Object.values(aumByType).reduce((s, v) => s + v, 0)

  const aumDonutOptions = useMemo(() => ({
    chart:   { type: 'pie', height: 280, backgroundColor: 'transparent', style: { fontFamily: 'inherit' } },
    title:   { text: null },
    credits: { enabled: false },
    tooltip: { formatter() { return `<b>${this.point.name}</b><br/>${fmtCurrency(this.y)}<br/>${this.point.percentage.toFixed(1)}%` } },
    plotOptions: {
      pie: {
        innerSize: '52%',
        dataLabels: { enabled: true, format: '<b>{point.name}</b>: {point.percentage:.1f}%', style: { fontSize: '11px', color: '#475569', fontWeight: 'normal' } },
      },
    },
    series: [{
      name: 'AUM',
      data: [
        { name: 'Standard', y: aumByType.Standard, color: '#94a3b8' },
        { name: 'Premium',  y: aumByType.Premium,  color: '#d4a843' },
        { name: 'Business', y: aumByType.Business, color: '#0d1b2a' },
      ],
    }],
    legend: { enabled: false },
  }), [aumByType])

  const joinYearChartOptions = useMemo(() => {
    const opts = columnChart(
      membersByJoinYear.map(([y]) => y),
      membersByJoinYear.map(([, c]) => c),
      '#1b2a3b',
    )
    opts.xAxis.labels = { ...opts.xAxis.labels, rotation: -45 }
    opts.tooltip = { pointFormat: '<b>{point.y}</b> new members' }
    opts.yAxis.allowDecimals = false
    return opts
  }, [membersByJoinYear])

  // ── Shared section header ─────────────────────────────────────────────
  function SectionHeader({ title, subtitle }) {
    return (
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-800">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    )
  }

  // ── Shared select ─────────────────────────────────────────────────────
  function Select({ value, onChange, options }) {
    return (
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-xs border border-slate-200 rounded px-2 py-1.5 text-slate-600 bg-white focus:outline-none focus:border-gold-400"
      >
        {options.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>
    )
  }

  return (
    <div className="space-y-10">

      {/* ═══════════════════════════════════════════════════════════════
          Section 1 — Dynamic Age Buckets
      ══════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader
          title="Age Bucket Analysis"
          subtitle="Define custom age ranges to compare member groups across key metrics."
        />

        {/* Bucket boundary editor */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 mb-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Age Boundaries</p>
          <div className="flex items-center gap-2 flex-wrap">

            {/* Fixed lower bound */}
            <span className="px-2.5 py-1 bg-slate-100 rounded-md font-mono text-xs text-slate-500">
              {boundaries[0]}
            </span>

            {/* Editable inner boundaries */}
            {boundaries.slice(1, -1).map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-slate-300 text-xs">──</span>
                <div className="relative group">
                  <input
                    type="number"
                    value={b}
                    min={boundaries[i] + 1}
                    max={boundaries[i + 2] - 1}
                    onChange={e => updateBoundary(i, e.target.value)}
                    className="w-14 px-2 py-1 text-xs text-center border border-slate-200 rounded-md font-mono focus:outline-none focus:border-gold-400 hover:border-slate-300 transition-colors"
                  />
                  {bucketCount > 2 && (
                    <button
                      onClick={() => removeBoundary(i)}
                      title="Remove boundary"
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-100 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X size={8} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Fixed upper bound */}
            <span className="text-slate-300 text-xs">──</span>
            <span className="px-2.5 py-1 bg-slate-100 rounded-md font-mono text-xs text-slate-500">
              {boundaries[boundaries.length - 1]}
            </span>

            {/* Add bucket */}
            <button
              onClick={addBucket}
              className="ml-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-navy-800 bg-gold-100 hover:bg-gold-200 rounded-lg transition-colors"
            >
              <Plus size={11} /> Add Bucket
            </button>
          </div>

          <p className="text-xs text-slate-400 mt-3">
            {bucketCount} bucket{bucketCount !== 1 ? 's' : ''}: {buckets.map(b => b.label).join(' · ')}
          </p>
        </div>

        {/* Chart + table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-700">Bucket Comparison</p>
              <Select value={bucketMetric} onChange={setBucketMetric} options={BUCKET_METRICS} />
            </div>
            <HighchartsReact highcharts={Highcharts} options={bucketChartOptions} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-700">Bucket Metrics</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wider text-left">
                    <th className="px-4 py-3 font-medium">Range</th>
                    <th className="px-4 py-3 font-medium text-right">Count</th>
                    <th className="px-4 py-3 font-medium text-right">Avg Balance</th>
                    <th className="px-4 py-3 font-medium text-right">Avg Tenure</th>
                    <th className="px-4 py-3 font-medium text-right">Avg Tx Vol</th>
                  </tr>
                </thead>
                <tbody>
                  {buckets.map((b, i) => (
                    <tr key={i} className={`border-t border-slate-50 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                      <td className="px-4 py-3 font-medium text-slate-700">{b.label}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{b.count}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{fmtCurrency(b.avgBalance)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{fmtYears(b.avgMembership)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{fmtCurrency(b.avgTxVolume)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          Section 2 — Member Segmentation
      ══════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader
          title="Member Segmentation"
          subtitle="Group members by a dimension and compare metrics across segments."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-700">Segment By</p>
                <Select value={segmentDim} onChange={setSegmentDim} options={SEGMENT_DIMENSIONS} />
              </div>
              <Select value={segmentMetric} onChange={setSegmentMetric} options={SEGMENT_METRICS} />
            </div>
            <HighchartsReact highcharts={Highcharts} options={segmentChartOptions} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-700">Segment Breakdown</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wider text-left">
                    <th className="px-4 py-3 font-medium">Segment</th>
                    <th className="px-4 py-3 font-medium text-right">Count</th>
                    <th className="px-4 py-3 font-medium text-right">Avg Balance</th>
                    <th className="px-4 py-3 font-medium text-right">Avg Tenure</th>
                  </tr>
                </thead>
                <tbody>
                  {segments.map((s, i) => (
                    <tr key={i} className={`border-t border-slate-50 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                      <td className="px-4 py-3 font-medium text-slate-700">{s.segment}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{s.count}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{fmtCurrency(s.avgBalance)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{fmtYears(s.avgMembership)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          Section 3 — Portfolio Distribution
      ══════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader
          title="Portfolio Distribution"
          subtitle="Asset breakdown by account type and member growth over time."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Assets by Account Type</p>
            <p className="text-xs text-slate-400 mt-0.5 mb-3">Total: {fmtCurrency(totalAUM)}</p>
            <HighchartsReact highcharts={Highcharts} options={aumDonutOptions} />
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Member Growth</p>
            <p className="text-xs text-slate-400 mt-0.5 mb-3">New members by join year</p>
            <HighchartsReact highcharts={Highcharts} options={joinYearChartOptions} />
          </div>
        </div>
      </section>

    </div>
  )
}

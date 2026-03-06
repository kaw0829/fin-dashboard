import Highcharts from 'highcharts'

Highcharts.setOptions({
  chart: {
    style:           { fontFamily: 'inherit' },
    backgroundColor: 'transparent',
  },
  colors: ['#d4a843', '#0d1b2a', '#94a3b8', '#1b2a3b', '#e0bc6b', '#2e4057'],
  title:   { text: null },
  credits: { enabled: false },
  legend:  { enabled: false },
  xAxis: {
    lineColor:  '#e2e8f0',
    tickColor:  'transparent',
    labels:     { style: { fontSize: '10px', color: '#94a3b8' } },
  },
  yAxis: {
    title:         { text: null },
    gridLineColor: '#f1f5f9',
    labels:        { style: { fontSize: '10px', color: '#94a3b8' } },
  },
  tooltip: {
    backgroundColor: '#ffffff',
    borderColor:     '#e2e8f0',
    borderRadius:    8,
    shadow:          false,
    style:           { color: '#1e293b', fontSize: '12px' },
  },
  plotOptions: {
    series: {
      animation: { duration: 400 },
    },
  },
})

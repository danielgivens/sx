import './style.css'
import { Chart } from 'chart.js/auto'

// Parse data from data.txt
async function loadData() {
  const response = await fetch(import.meta.env.BASE_URL + 'data.txt')
  const text = await response.text()

  const racers = []
  const lines = text.trim().split('\n')

  lines.forEach(line => {
    const parts = line.split(',').map(s => s.trim())
    const name = parts[0]
    const scores = parts.slice(1).map(Number)
    racers.push({ name, scores })
  })

  return racers
}

// Calculate positions for each round based on cumulative totals
function calculatePositions(racers) {
  const rounds = racers[0].scores.length
  const positions = []

  for (let round = 0; round < rounds; round++) {
    const cumulativeScores = racers.map((racer, idx) => ({
      index: idx,
      name: racer.name,
      // Calculate cumulative total up to and including this round
      cumulativeTotal: racer.scores.slice(0, round + 1).reduce((sum, score) => sum + score, 0)
    }))

    // Sort by cumulative total descending (higher total = better position)
    cumulativeScores.sort((a, b) => b.cumulativeTotal - a.cumulativeTotal)

    const roundPositions = new Array(racers.length)
    cumulativeScores.forEach((racer, position) => {
      roundPositions[racer.index] = position + 1
    })

    positions.push(roundPositions)
  }

  return positions
}

// Color palette for racers - 9 maximally different colors
const colors = [
  '#ff0000', // red
  '#00ff00', // green
  '#0000ff', // blue
  '#ffff00', // yellow
  '#ff00ff', // magenta
  '#00ffff', // cyan
  '#ffffff', // white
  '#888888', // gray
  '#ff8800', // orange
]

// Create bump chart
function createBumpChart(racers, positions) {
  const rounds = positions.length

  // Create datasets with total scores for sorting
  const datasetsWithTotals = racers.map((racer, idx) => {
    const racerPositions = positions.map(round => round[idx])
    const total = racer.scores.reduce((sum, score) => sum + score, 0)

    return {
      label: racer.name,
      data: racerPositions,
      scores: racer.scores, // Include scores for tooltip
      borderColor: colors[idx % colors.length],
      backgroundColor: colors[idx % colors.length],
      borderWidth: 4,
      pointRadius: 6,
      pointHoverRadius: 8,
      tension: 0.3,
      total: total
    }
  })

  // Sort by total score descending (best to worst)
  datasetsWithTotals.sort((a, b) => b.total - a.total)

  // Remove total property (not needed for Chart.js, but keep scores)
  const datasets = datasetsWithTotals.map(({ total, ...dataset }) => dataset)

  const labels = Array.from({ length: rounds }, (_, i) => `R${i + 1}`)

  const ctx = document.getElementById('lapChart')

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 0,
          bottom: 10,
          left: 0,
          right: 0
        }
      },
      elements: {
        line: {
          clip: false
        },
        point: {
          clip: false
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          align: 'start',
          labels: {
            color: '#6ee7b7',
            font: {
              family: 'monospace',
              size: 12
            },
          }
        },
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          titleColor: '#6ee7b7',
          bodyColor: '#6ee7b7',
          borderColor: '#6ee7b7',
          borderWidth: 1,
          titleFont: {
            family: 'monospace'
          },
          bodyFont: {
            family: 'monospace'
          },
          callbacks: {
            label: function(context) {
              const roundIndex = context.dataIndex
              const score = context.dataset.scores[roundIndex]
              return context.dataset.label + ': ' + score + ' pts'
            }
          },
          itemSort: function(a, b) {
            // Sort by cumulative total up to this round (descending)
            const roundIndex = a.dataIndex

            // Calculate cumulative total for racer A up to this round
            const totalA = a.dataset.scores.slice(0, roundIndex + 1).reduce((sum, score) => sum + score, 0)

            // Calculate cumulative total for racer B up to this round
            const totalB = b.dataset.scores.slice(0, roundIndex + 1).reduce((sum, score) => sum + score, 0)

            // Sort descending (highest total first)
            return totalB - totalA
          }
        }
      },
      scales: {
        y: {
          reverse: true, // Position 1 at top
          min: 0.5,
          max: racers.length + 0.5,
          ticks: {
            stepSize: 1,
            color: '#6ee7b7',
            font: {
              family: 'monospace'
            },
            callback: function(value) {
              if (!Number.isInteger(value) || value < 1 || value > racers.length) return ''
              return 'P' + value
            }
          },
          grid: {
            color: 'rgba(110, 231, 183, 0.1)',
            drawBorder: false
          },
          title: {
            display: false,
            text: 'Position',
            color: '#6ee7b7',
            font: {
              family: 'monospace'
            }
          }
        },
        x: {
          ticks: {
            color: '#6ee7b7',
            font: {
              family: 'monospace'
            }
          },
          grid: {
            color: 'rgba(110, 231, 183, 0.1)'
          },
          title: {
            display: true,
            text: 'Round',
            color: '#6ee7b7',
            font: {
              family: 'monospace'
            }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  })
}

// Create standings table
function createStandings(racers) {
  const totals = racers.map((racer, idx) => ({
    index: idx,
    name: racer.name,
    total: racer.scores.reduce((sum, score) => sum + score, 0),
    scores: racer.scores
  }))

  totals.sort((a, b) => b.total - a.total)

  let standings = '<div class="mt-8">\n'
  standings += '<h2 class="mb-4">Average Scores</h2>\n'
  standings += '<div class="overflow-x-auto">\n'
  standings += '<pre class="text-xs sm:text-sm">\n'
  standings += 'Pos  Name                  Total Points   Avg\n'
  standings += '───  ──────────────────    ────────────   ────\n'

  totals.forEach((racer, idx) => {
    const pos = (idx + 1).toString().padStart(2, ' ')
    const name = racer.name.padEnd(20, ' ')
    const total = racer.total.toString().padStart(6, ' ')
    const avg = (racer.total / racer.scores.length).toFixed(1).padStart(5, ' ')
    standings += pos + '   ' + name + '  ' + total + '       ' + avg + '\n'
  })

  standings += '</pre>\n'
  standings += '</div>\n'
  standings += '</div>\n'

  return standings
}

// Create top scores list
function createTopScores(racers) {
  const allScores = []

  racers.forEach(racer => {
    racer.scores.forEach((score, roundIdx) => {
      allScores.push({
        name: racer.name,
        score: score,
        round: roundIdx + 1
      })
    })
  })

  // Sort by score descending
  allScores.sort((a, b) => b.score - a.score)

  // Take top 10
  const topScores = allScores.slice(0, 10)

  let html = '<div class="mt-8">\n'
  html += '<h2 class="mb-4">Top Scorers</h2>\n'
  html += '<div class="overflow-x-auto">\n'
  html += '<pre class="text-xs sm:text-sm">\n'
  html += 'Rank  Name                  Score   Round\n'
  html += '────  ──────────────────    ─────   ─────\n'

  topScores.forEach((item, idx) => {
    const rank = (idx + 1).toString().padStart(2, ' ')
    const name = item.name.padEnd(20, ' ')
    const score = item.score.toString().padStart(5, ' ')
    const round = ('R' + item.round).padStart(5, ' ')
    html += rank + '    ' + name + '  ' + score + '   ' + round + '\n'
  })

  html += '</pre>\n'
  html += '</div>\n'
  html += '</div>\n'

  return html
}

// Initialize
async function init() {
  const app = document.getElementById('app')

  try {
    const racers = await loadData()
    const positions = calculatePositions(racers)

    // Build the UI
    let html = '<div class="mb-8 overflow-x-auto">\n'
    html += '<div style="" class="w-full h-96 sm:h-[500px] md:h-[600px]">\n'
    html += '<canvas id="lapChart"></canvas>\n'
    html += '</div>\n'
    html += '</div>\n'
    html += createTopScores(racers)
    html += createStandings(racers)

    app.innerHTML = html

    // Create the chart after DOM is ready
    createBumpChart(racers, positions)
  } catch (error) {
    app.innerHTML = '<p class="text-red-400">Error loading data: ' + error.message + '</p>'
    console.error(error)
  }
}

init()

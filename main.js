import './style.css'
import { Chart } from 'chart.js/auto'

// Parse data from data.json
async function loadData() {
  const response = await fetch(import.meta.env.BASE_URL + 'data.json')
  const racers = await response.json()
  return racers
}

// Calculate race positions for each round based on individual round scores
function calculateRacePositions(racers) {
  const rounds = racers[0].scores.length
  const positions = []

  for (let round = 0; round < rounds; round++) {
    const roundScores = racers.map((racer, idx) => ({
      index: idx,
      name: racer.name,
      score: racer.scores[round]
    }))

    // Sort by round score descending (higher score = better position)
    roundScores.sort((a, b) => b.score - a.score)

    const roundPositions = new Array(racers.length)
    roundScores.forEach((racer, position) => {
      roundPositions[racer.index] = position + 1
    })

    positions.push(roundPositions)
  }

  return positions
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

// Create pie chart showing total points by brand
function createBrandPieChart(racers) {
  // Aggregate points by brand
  const brandTotals = {}

  racers.forEach(racer => {
    const total = racer.scores.reduce((sum, score) => sum + score, 0)
    if (!brandTotals[racer.brand]) {
      brandTotals[racer.brand] = 0
    }
    brandTotals[racer.brand] += total
  })

  // Sort brands by total points descending
  const sortedBrands = Object.entries(brandTotals).sort((a, b) => b[1] - a[1])
  const labels = sortedBrands.map(([brand]) => brand)
  const data = sortedBrands.map(([, total]) => total)

  // Brand colors
  const brandColors = {
    'KTM': '#ff6600',
    'HUS': '#ffd700',
    'GAS': '#ff0000',
    'BETA': '#0066cc',
    'HON': '#cc0000',
    'YAM': '#0051ba',
    'KAW': '#00cc00',
    'SUZ': '#ffcc00'
  }

  const backgroundColors = labels.map(brand => brandColors[brand] || '#888888')

  const ctx = document.getElementById('brandPieChart')

  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColors,
        borderColor: '#111827',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 10,
          bottom: 10,
          left: 10,
          right: 10
        }
      },
      plugins: {
        legend: {
          display: false
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
            family: 'monospace',
            size: 14
          },
          callbacks: {
            label: function(context) {
              const total = data.reduce((sum, val) => sum + val, 0)
              const value = context.parsed
              const percentage = ((value / total) * 100).toFixed(1)
              return context.label + ': ' + value + ' pts (' + percentage + '%)'
            }
          }
        }
      }
    }
  })
}

// Create bar chart showing podium counts by brand
function createBrandPodiumChart(racers, racePositions) {
  // Calculate podium counts per brand
  const brandPodiums = {}
  const racerPodiums = {} // Track individual racer podiums for debugging
  const racerPodiumDetails = {} // Track which rounds were podiums

  racers.forEach((racer, racerIdx) => {
    if (!brandPodiums[racer.brand]) {
      brandPodiums[racer.brand] = 0
    }
    racerPodiums[racer.name] = 0
    racerPodiumDetails[racer.name] = []

    // Count podiums (P1, P2, P3) for this racer
    racePositions.forEach((roundPositions, roundIdx) => {
      const position = roundPositions[racerIdx]
      if (position <= 3) {
        brandPodiums[racer.brand]++
        racerPodiums[racer.name]++
        racerPodiumDetails[racer.name].push({
          round: roundIdx + 1,
          position: position,
          score: racers[racerIdx].scores[roundIdx]
        })
      }
    })
  })

  // Debug output
  console.log('Podium details by racer:', racerPodiumDetails)
  console.log('Individual racer podium counts:', racerPodiums)
  console.log('Brand podium totals:', brandPodiums)

  // Sort brands by podium count descending
  const sortedBrands = Object.entries(brandPodiums).sort((a, b) => b[1] - a[1])
  const labels = sortedBrands.map(([brand]) => brand)
  const data = sortedBrands.map(([, count]) => count)

  // Brand colors
  const brandColors = {
    'KTM': '#ff6600',
    'HUS': '#ffd700',
    'GAS': '#ff0000',
    'BETA': '#0066cc',
    'HON': '#cc0000',
    'YAM': '#0051ba',
    'KAW': '#00cc00',
    'SUZ': '#ffcc00'
  }

  const backgroundColors = labels.map(brand => brandColors[brand] || '#888888')

  const ctx = document.getElementById('brandPodiumChart')

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Podium Finishes',
        data: data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 10,
          bottom: 10,
          left: 10,
          right: 10
        }
      },
      plugins: {
        legend: {
          display: false
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
            family: 'monospace',
            size: 14
          },
          callbacks: {
            label: function(context) {
              return context.parsed.y + ' podiums'
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            color: '#6ee7b7',
            font: {
              family: 'monospace'
            }
          },
          grid: {
            color: 'rgba(110, 231, 183, 0.1)',
            drawBorder: false
          },
          title: {
            display: false
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
            display: false
          }
        }
      }
    }
  })
}

// Create race positions chart (based on individual round finishes)
function createRacePositionsChart(racers, positions) {
  const rounds = positions.length

  // Create datasets with total scores for sorting
  const datasetsWithTotals = racers.map((racer, idx) => {
    const racerPositions = positions.map(round => round[idx])
    const totalPoints = racer.scores.reduce((sum, score) => sum + score, 0)
    const latestPosition = racerPositions[racerPositions.length - 1]

    return {
      label: racer.name + ' (' + totalPoints + ')',
      data: racerPositions,
      scores: racer.scores,
      borderColor: colors[idx % colors.length],
      backgroundColor: colors[idx % colors.length],
      borderWidth: 4,
      pointRadius: 6,
      pointHoverRadius: 8,
      tension: 0.3,
      totalPoints: totalPoints,
      latestPosition: latestPosition
    }
  })

  // Sort by total points (descending)
  datasetsWithTotals.sort((a, b) => b.totalPoints - a.totalPoints)

  // Remove sorting properties
  const datasets = datasetsWithTotals.map(({ totalPoints, latestPosition, ...dataset }) => dataset)

  const labels = Array.from({ length: rounds }, (_, i) => `R${i + 1}`)

  const ctx = document.getElementById('racePositionsChart')

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
              const position = context.parsed.y
              return context.dataset.label + ': P' + position + ' (' + score + ' pts)'
            }
          },
          itemSort: function(a, b) {
            // Sort by position in this round (ascending - P1 first)
            return a.parsed.y - b.parsed.y
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
            display: false,
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

// Create bump chart (based on cumulative championship standings)
function createBumpChart(racers, positions) {
  const rounds = positions.length

  // Create datasets with total scores for sorting
  const datasetsWithTotals = racers.map((racer, idx) => {
    const racerPositions = positions.map(round => round[idx])
    const latestPosition = racerPositions[racerPositions.length - 1] // Position in latest round
    const totalPoints = racer.scores.reduce((sum, score) => sum + score, 0)

    return {
      label: racer.name + ' (' + totalPoints + ')',
      data: racerPositions,
      scores: racer.scores, // Include scores for tooltip
      borderColor: colors[idx % colors.length],
      backgroundColor: colors[idx % colors.length],
      borderWidth: 4,
      pointRadius: 6,
      pointHoverRadius: 8,
      tension: 0.3,
      latestPosition: latestPosition
    }
  })

  // Sort by latest round position (ascending - P1, P2, P3, etc.)
  datasetsWithTotals.sort((a, b) => a.latestPosition - b.latestPosition)

  // Remove latestPosition property (not needed for Chart.js, but keep scores)
  const datasets = datasetsWithTotals.map(({ latestPosition, ...dataset }) => dataset)

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
            display: false,
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

// Create brand roster display
function createBrandRoster(racers) {
  // Group riders by brand
  const brandRiders = {}

  racers.forEach(racer => {
    if (!brandRiders[racer.brand]) {
      brandRiders[racer.brand] = []
    }
    brandRiders[racer.brand].push(racer.name)
  })

  // Brand colors
  const brandColors = {
    'KTM': '#ff6600',
    'HUS': '#ffd700',
    'GAS': '#ff0000',
    'BETA': '#0066cc',
    'HON': '#cc0000',
    'YAM': '#0051ba',
    'KAW': '#00cc00',
    'SUZ': '#ffcc00'
  }

  // Sort brands alphabetically
  const sortedBrands = Object.keys(brandRiders).sort()

  let html = '<div class="mt-4 mb-8">\n'
  html += '<div class="flex flex-wrap gap-x-6 gap-y-2 items-center">\n'

  sortedBrands.forEach(brand => {
    const riders = brandRiders[brand].join(', ')
    const color = brandColors[brand] || '#6ee7b7'
    html += '<span class="flex items-center gap-2">'
    html += '<span style="display: inline-block; width: 48px; height: 16px; background-color: ' + color + ';"></span>'
    html += '<span>' + riders + '</span>'
    html += '</span>\n'
  })

  html += '</div>\n'
  html += '</div>\n'

  return html
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

  const leaderTotal = totals[0].total

  let standings = '<div class="mt-8">\n'
  standings += '<h2 class="mb-4">Standings</h2>\n'
  standings += '<div class="overflow-x-auto">\n'
  standings += '<pre class="">\n'
  standings += 'Pos  Name                  Total Points   Avg    Behind\n'
  standings += '───  ──────────────────    ────────────   ────   ──────\n'

  totals.forEach((racer, idx) => {
    const pos = (idx + 1).toString().padStart(2, ' ')
    const name = racer.name.padEnd(20, ' ')
    const total = racer.total.toString().padStart(6, ' ')
    const avg = (racer.total / racer.scores.length).toFixed(1).padStart(5, ' ')
    const behindValue = racer.total - leaderTotal
    const behind = behindValue.toString().padStart(6, ' ')
    standings += pos + '   ' + name + '  ' + total + '       ' + avg + '    ' + behind + '\n'
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
  html += '<pre class="">\n'
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

// Create lowest scores list
function createLowestScores(racers) {
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

  // Sort by score ascending (lowest first)
  allScores.sort((a, b) => a.score - b.score)

  // Take bottom 10
  const lowestScores = allScores.slice(0, 10)

  let html = '<div class="mt-8">\n'
  html += '<h2 class="mb-4">Lowest Scorers</h2>\n'
  html += '<div class="overflow-x-auto">\n'
  html += '<pre class="">\n'
  html += 'Rank  Name                  Score   Round\n'
  html += '────  ──────────────────    ─────   ─────\n'

  lowestScores.forEach((item, idx) => {
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

// Create podiums list
function createPodiums(racers, positions) {
  const podiumCounts = racers.map((racer, idx) => {
    // Count how many times this racer was in positions 1, 2, or 3
    let podiumCount = 0
    positions.forEach(roundPositions => {
      if (roundPositions[idx] <= 3) {
        podiumCount++
      }
    })

    return {
      name: racer.name,
      podiums: podiumCount
    }
  })

  // Sort by podium count descending
  podiumCounts.sort((a, b) => b.podiums - a.podiums)

  let html = '<div class="mt-8">\n'
  html += '<h2 class="mb-4">Podium Finishes</h2>\n'
  html += '<div class="overflow-x-auto">\n'
  html += '<pre class="">\n'
  html += 'Pos  Name                  Podiums\n'
  html += '───  ──────────────────    ───────\n'

  podiumCounts.forEach((item, idx) => {
    const pos = (idx + 1).toString().padStart(2, ' ')
    const name = item.name.padEnd(20, ' ')
    const podiums = item.podiums.toString().padStart(7, ' ')
    html += pos + '   ' + name + '  ' + podiums + '\n'
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
    const racePositions = calculateRacePositions(racers)
    const championshipPositions = calculatePositions(racers)

    // Build the UI
    let html = '<h2 class="mb-4">Race Positions</h2>\n'
    html += '<div class="mb-8 overflow-x-auto">\n'
    html += '<div style="" class="w-full h-[500px] sm:h-[600px] md:h-[700px]">\n'
    html += '<canvas id="racePositionsChart"></canvas>\n'
    html += '</div>\n'
    html += '</div>\n'
    html += '<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">\n'
    html += '<div class="overflow-x-auto">\n'
    html += '<h2 class="mb-4">Brand Points Distribution</h2>\n'
    html += '<div style="" class="w-full h-[400px] sm:h-[500px]">\n'
    html += '<canvas id="brandPieChart"></canvas>\n'
    html += '</div>\n'
    html += '</div>\n'
    html += '<div class="overflow-x-auto">\n'
    html += '<h2 class="mb-4">Brand Podium Finishes</h2>\n'
    html += '<div style="" class="w-full h-[400px] sm:h-[500px]">\n'
    html += '<canvas id="brandPodiumChart"></canvas>\n'
    html += '</div>\n'
    html += '</div>\n'
    html += '</div>\n'
    html += createBrandRoster(racers)
    html += '<h2 class="mb-4 mt-12">Championship Standings</h2>\n'
    html += '<div class="mb-8 overflow-x-auto">\n'
    html += '<div style="" class="w-full h-[500px] sm:h-[600px] md:h-[700px]">\n'
    html += '<canvas id="lapChart"></canvas>\n'
    html += '</div>\n'
    html += '</div>\n'
    html += createStandings(racers)
    html += createTopScores(racers)
    html += createLowestScores(racers)
    html += createPodiums(racers, championshipPositions)

    app.innerHTML = html

    // Create the charts after DOM is ready
    createRacePositionsChart(racers, racePositions)
    createBrandPieChart(racers)
    createBrandPodiumChart(racers, racePositions)
    createBumpChart(racers, championshipPositions)
  } catch (error) {
    app.innerHTML = '<p class="text-red-400">Error loading data: ' + error.message + '</p>'
    console.error(error)
  }
}

init()

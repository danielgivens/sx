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

// Helper function to generate initials from racer name
function getInitials(name) {
  // Custom mappings for specific names
  const customInitials = {
    'Theplantlady': 'TPL',
    'BigJeffZilla': 'BJZ',
    'Planiel': 'PLA'
  }

  if (customInitials[name]) {
    return customInitials[name]
  }

  // Split on common separators and take first letter of each part
  const parts = name.split(/[\s_-]+/).filter(p => p.length > 0)
  if (parts.length === 1) {
    // If single word, take first 2-3 letters
    return name.substring(0, Math.min(3, name.length)).toUpperCase()
  }
  // Take first letter of each word, max 3
  return parts.slice(0, 3).map(p => p[0].toUpperCase()).join('')
}

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

// Create stacked bar chart showing points by round for each racer
function createStackedPointsChart(racers) {
  const rounds = racers[0].scores.length

  // Generate colors for each round - using vibrant colors
  const roundColors = [
    '#ff0000', // red
    '#00ffff', // cyan
    '#0000ff', // blue
    '#ffff00', // yellow
    '#ff00ff', // magenta
    '#00ff00', // green
    '#ff8800', // orange
    '#00ff88', // spring green
    '#ff0088', // pink
    '#8800ff', // purple
    '#00ff00', // lime
    '#ff00ff', // fuchsia
    '#ff4400'  // orange-red
  ]

  // Sort racers by total points
  const racersWithTotals = racers.map((racer, idx) => ({
    racer: racer,
    total: racer.scores.reduce((sum, score) => sum + score, 0)
  }))
  racersWithTotals.sort((a, b) => b.total - a.total)

  // Create labels (racer names with totals)
  const labels = racersWithTotals.map(({ racer, total }) => racer.name + ' (' + total + ')')

  // Create datasets - one for each round
  const datasets = []
  for (let roundIdx = 0; roundIdx < rounds; roundIdx++) {
    datasets.push({
      label: 'R' + (roundIdx + 1),
      data: racersWithTotals.map(({ racer }) => racer.scores[roundIdx]),
      backgroundColor: roundColors[roundIdx % roundColors.length],
      borderWidth: 0
    })
  }

  const ctx = document.getElementById('stackedPointsChart')

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y', // Horizontal bars
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
          display: true,
          position: 'bottom',
          labels: {
            color: '#6ee7b7',
            font: {
              family: 'monospace',
              size: 11
            },
            boxWidth: 15,
            padding: 10
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
              const label = context.dataset.label || ''
              const value = context.parsed.x
              return label + ': ' + value + ' pts'
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          beginAtZero: true,
          ticks: {
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
            display: true,
            text: 'Points',
            color: '#6ee7b7',
            font: {
              family: 'monospace'
            }
          }
        },
        y: {
          stacked: true,
          ticks: {
            color: '#6ee7b7',
            font: {
              family: 'monospace',
              size: 11
            }
          },
          grid: {
            color: 'rgba(110, 231, 183, 0.1)'
          }
        }
      }
    }
  })
}

// Create points progression chart showing cumulative points over rounds
function createPointsProgressionChart(racers) {
  const rounds = racers[0].scores.length

  // Create datasets with cumulative points for each round
  const datasetsWithTotals = racers.map((racer, idx) => {
    const cumulativePoints = []
    let runningTotal = 0

    racer.scores.forEach(score => {
      runningTotal += score
      cumulativePoints.push(runningTotal)
    })

    const totalPoints = racer.scores.reduce((sum, score) => sum + score, 0)

    return {
      label: racer.name + ' (' + totalPoints + ')',
      data: cumulativePoints,
      scores: racer.scores, // Individual round scores for tooltip
      borderColor: colors[idx % colors.length],
      backgroundColor: colors[idx % colors.length],
      borderWidth: 4,
      pointRadius: 6,
      pointHoverRadius: 8,
      tension: 0.3,
      totalPoints: totalPoints
    }
  })

  // Sort by total points (descending)
  datasetsWithTotals.sort((a, b) => b.totalPoints - a.totalPoints)

  // Remove sorting properties
  const datasets = datasetsWithTotals.map(({ totalPoints, ...dataset }) => dataset)

  const labels = Array.from({ length: rounds }, (_, i) => `R${i + 1}`)

  const ctx = document.getElementById('pointsProgressionChart')

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
              const roundScore = context.dataset.scores[roundIndex]
              const cumulativePoints = context.parsed.y
              return context.dataset.label + ': ' + cumulativePoints + ' pts (+' + roundScore + ')'
            }
          },
          itemSort: function(a, b) {
            // Sort by cumulative points (descending - highest first)
            return b.parsed.y - a.parsed.y
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 640,
          ticks: {
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
            display: true,
            text: 'Cumulative Points',
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

  let html = '<div class="my-8 py-4">\n'
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

// Create brand points table
function createBrandPoints(racers, racePositions) {
  const brandPoints = {}
  const brandRiderCounts = {}
  const brandWins = {}
  const brandPodiums = {}

  racers.forEach((racer, racerIdx) => {
    const total = racer.scores.reduce((sum, score) => sum + score, 0)
    if (!brandPoints[racer.brand]) {
      brandPoints[racer.brand] = 0
      brandRiderCounts[racer.brand] = 0
      brandWins[racer.brand] = 0
      brandPodiums[racer.brand] = 0
    }
    brandPoints[racer.brand] += total
    brandRiderCounts[racer.brand]++

    // Count wins and podiums
    racePositions.forEach(roundPositions => {
      const position = roundPositions[racerIdx]
      if (position === 1) {
        brandWins[racer.brand]++
      }
      if (position <= 3) {
        brandPodiums[racer.brand]++
      }
    })
  })

  const sortedBrands = Object.entries(brandPoints).sort((a, b) => b[1] - a[1])

  let html = '<div class="col-span-full">\n'
  html += '<h2 class="mb-4">Brand Points</h2>\n'
  html += '<div class="overflow-x-auto">\n'
  html += '<table class="w-full text-left" style="font-family: monospace; border: 1px solid rgba(110, 231, 183, 0.1);">\n'
  html += '<thead><tr style="border-bottom: 1px solid rgba(110, 231, 183, 0.1);">\n'
  html += '<th class="py-2 px-4">Pos</th>\n'
  html += '<th class="py-2 px-4">Brand</th>\n'
  html += '<th class="py-2 px-4 text-right">Points</th>\n'
  html += '<th class="py-2 px-4 text-right">Riders</th>\n'
  html += '<th class="py-2 px-4 text-right">Avg/Rider</th>\n'
  html += '<th class="py-2 px-4 text-right">Wins</th>\n'
  html += '<th class="py-2 px-4 text-right">Podiums</th>\n'
  html += '</tr></thead>\n'
  html += '<tbody>\n'

  sortedBrands.forEach(([brand, points], idx) => {
    const pos = idx + 1
    const avg = (points / brandRiderCounts[brand]).toFixed(1)
    html += '<tr style="border-bottom: 1px solid rgba(110, 231, 183, 0.1);">\n'
    html += '<td class="py-2 px-4">' + pos + '</td>\n'
    html += '<td class="py-2 px-4">' + brand + '</td>\n'
    html += '<td class="py-2 px-4 text-right">' + points + '</td>\n'
    html += '<td class="py-2 px-4 text-right">' + brandRiderCounts[brand] + '</td>\n'
    html += '<td class="py-2 px-4 text-right">' + avg + '</td>\n'
    html += '<td class="py-2 px-4 text-right">' + brandWins[brand] + '</td>\n'
    html += '<td class="py-2 px-4 text-right">' + brandPodiums[brand] + '</td>\n'
    html += '</tr>\n'
  })

  html += '</tbody>\n'
  html += '</table>\n'
  html += '</div>\n'
  html += '</div>\n'

  return html
}

// Create results grid table showing initials and colors for each round
function createResultsGrid(racers, racePositions) {
  const rounds = racers[0].scores.length

  let html = '<div class="col-span-full mb-8">\n'
  html += '<h2 class="mb-4">Results by Round</h2>\n'
  html += '<div class="overflow-x-auto">\n'
  html += '<table class="w-full text-left" style="font-family: monospace; border: 1px solid rgba(110, 231, 183, 0.1);">\n'
  html += '<thead><tr style="border-bottom: 1px solid rgba(110, 231, 183, 0.1);">\n'

  // Create column headers for each round
  for (let i = 0; i < rounds; i++) {
    html += '<th class="py-2 px-4 text-center">R' + (i + 1) + '</th>\n'
  }

  html += '</tr></thead>\n'
  html += '<tbody>\n'

  // Create rows for each position (P1 through P9)
  for (let position = 1; position <= racers.length; position++) {
    html += '<tr style="border-bottom: 1px solid rgba(110, 231, 183, 0.1);">\n'

    // For each round, find who finished in this position
    for (let roundIdx = 0; roundIdx < rounds; roundIdx++) {
      const roundPositions = racePositions[roundIdx]

      // Find the racer who finished in this position in this round
      const racerIdx = roundPositions.indexOf(position)

      if (racerIdx !== -1) {
        const racer = racers[racerIdx]
        const initials = getInitials(racer.name)
        const racerColor = colors[racerIdx % colors.length]
        const score = racer.scores[roundIdx]

        html += '<td class="py-2 px-4 text-center" title="' + racer.name + ': ' + score + ' pts" style="background-color: ' + racerColor + ';">'
        html += '<span style="color: #111827; font-weight: bold;">' + initials + '</span>'
        html += '</td>\n'
      } else {
        html += '<td class="py-2 px-4 text-center">-</td>\n'
      }
    }

    html += '</tr>\n'
  }

  html += '</tbody>\n'
  html += '</table>\n'
  html += '</div>\n'
  html += '</div>\n'

  return html
}

// Create round results tables
function createRoundResults(racers, racePositions) {
  const rounds = racers[0].scores.length
  let html = ''

  // Loop backwards to show most recent round first
  for (let roundIdx = rounds - 1; roundIdx >= 0; roundIdx--) {
    const roundNum = roundIdx + 1

    // Get all racers with their position and score for this round
    const roundResults = racers.map((racer, racerIdx) => ({
      name: racer.name,
      position: racePositions[roundIdx][racerIdx],
      score: racer.scores[roundIdx]
    }))

    // Sort by position
    roundResults.sort((a, b) => a.position - b.position)

    html += '<div>\n'
    html += '<h2 class="mb-4">Round ' + roundNum + '</h2>\n'
    html += '<div class="overflow-x-auto">\n'
    html += '<table class="w-full text-left" style="font-family: monospace; border: 1px solid rgba(110, 231, 183, 0.1);">\n'
    html += '<thead><tr style="border-bottom: 1px solid rgba(110, 231, 183, 0.1);">\n'
    html += '<th class="py-2 px-4">Pos</th>\n'
    html += '<th class="py-2 px-4">Name</th>\n'
    html += '<th class="py-2 px-4 text-right">Score</th>\n'
    html += '</tr></thead>\n'
    html += '<tbody>\n'

    roundResults.forEach((result) => {
      html += '<tr style="border-bottom: 1px solid rgba(110, 231, 183, 0.1);">\n'
      html += '<td class="py-2 px-4">P' + result.position + '</td>\n'
      html += '<td class="py-2 px-4">' + result.name + '</td>\n'
      html += '<td class="py-2 px-4 text-right">' + result.score + '</td>\n'
      html += '</tr>\n'
    })

    html += '</tbody>\n'
    html += '</table>\n'
    html += '</div>\n'
    html += '</div>\n'
  }

  return html
}

// Create standings table
function createStandings(racers, racePositions) {
  const totals = racers.map((racer, idx) => ({
    index: idx,
    name: racer.name,
    total: racer.scores.reduce((sum, score) => sum + score, 0),
    scores: racer.scores,
    wins: 0,
    podiums: 0
  }))

  // Calculate wins and podium counts for each racer
  racers.forEach((racer, racerIdx) => {
    racePositions.forEach(roundPositions => {
      if (roundPositions[racerIdx] === 1) {
        totals[racerIdx].wins++
      }
      if (roundPositions[racerIdx] <= 3) {
        totals[racerIdx].podiums++
      }
    })
  })

  totals.sort((a, b) => b.total - a.total)

  const leaderTotal = totals[0].total

  let standings = '<div class="col-span-full">\n'
  standings += '<h2 class="mb-4">Standings</h2>\n'
  standings += '<div class="overflow-x-auto">\n'
  standings += '<table class="w-full text-left" style="font-family: monospace; border: 1px solid rgba(110, 231, 183, 0.1);">\n'
  standings += '<thead><tr style="border-bottom: 1px solid rgba(110, 231, 183, 0.1);">\n'
  standings += '<th class="py-2 px-4">Pos</th>\n'
  standings += '<th class="py-2 px-4">Name</th>\n'
  standings += '<th class="py-2 px-4 text-right">Total</th>\n'
  standings += '<th class="py-2 px-4 text-right">Avg</th>\n'
  standings += '<th class="py-2 px-4 text-right">Behind</th>\n'
  standings += '<th class="py-2 px-4 text-right">Wins</th>\n'
  standings += '<th class="py-2 px-4 text-right">Podiums</th>\n'
  standings += '</tr></thead>\n'
  standings += '<tbody>\n'

  totals.forEach((racer, idx) => {
    const pos = idx + 1
    const avg = (racer.total / racer.scores.length).toFixed(1)
    const behind = racer.total - leaderTotal
    standings += '<tr style="border-bottom: 1px solid rgba(110, 231, 183, 0.1);">\n'
    standings += '<td class="py-2 px-4">' + pos + '</td>\n'
    standings += '<td class="py-2 px-4">' + racer.name + '</td>\n'
    standings += '<td class="py-2 px-4 text-right">' + racer.total + '</td>\n'
    standings += '<td class="py-2 px-4 text-right">' + avg + '</td>\n'
    standings += '<td class="py-2 px-4 text-right">' + behind + '</td>\n'
    standings += '<td class="py-2 px-4 text-right">' + racer.wins + '</td>\n'
    standings += '<td class="py-2 px-4 text-right">' + racer.podiums + '</td>\n'
    standings += '</tr>\n'
  })

  standings += '</tbody>\n'
  standings += '</table>\n'
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

  let html = '<div class="lg:col-span-2">\n'
  html += '<h2 class="mb-4">Top Scorers</h2>\n'
  html += '<div class="overflow-x-auto">\n'
  html += '<table class="w-full text-left" style="font-family: monospace; border: 1px solid rgba(110, 231, 183, 0.1);">\n'
  html += '<thead><tr style="border-bottom: 1px solid rgba(110, 231, 183, 0.1);">\n'
  html += '<th class="py-2 px-4">Rank</th>\n'
  html += '<th class="py-2 px-4">Name</th>\n'
  html += '<th class="py-2 px-4 text-right">Score</th>\n'
  html += '<th class="py-2 px-4 text-right">Round</th>\n'
  html += '</tr></thead>\n'
  html += '<tbody>\n'

  topScores.forEach((item, idx) => {
    const rank = idx + 1
    html += '<tr style="border-bottom: 1px solid rgba(110, 231, 183, 0.1);">\n'
    html += '<td class="py-2 px-4">' + rank + '</td>\n'
    html += '<td class="py-2 px-4">' + item.name + '</td>\n'
    html += '<td class="py-2 px-4 text-right">' + item.score + '</td>\n'
    html += '<td class="py-2 px-4 text-right">R' + item.round + '</td>\n'
    html += '</tr>\n'
  })

  html += '</tbody>\n'
  html += '</table>\n'
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

  let html = '<div class="lg:col-span-2">\n'
  html += '<h2 class="mb-4">Lowest Scorers</h2>\n'
  html += '<div class="overflow-x-auto">\n'
  html += '<table class="w-full text-left" style="font-family: monospace; border: 1px solid rgba(110, 231, 183, 0.1);">\n'
  html += '<thead><tr style="border-bottom: 1px solid rgba(110, 231, 183, 0.1);">\n'
  html += '<th class="py-2 px-4">Rank</th>\n'
  html += '<th class="py-2 px-4">Name</th>\n'
  html += '<th class="py-2 px-4 text-right">Score</th>\n'
  html += '<th class="py-2 px-4 text-right">Round</th>\n'
  html += '</tr></thead>\n'
  html += '<tbody>\n'

  lowestScores.forEach((item, idx) => {
    const rank = idx + 1
    html += '<tr style="border-bottom: 1px solid rgba(110, 231, 183, 0.1);">\n'
    html += '<td class="py-2 px-4">' + rank + '</td>\n'
    html += '<td class="py-2 px-4">' + item.name + '</td>\n'
    html += '<td class="py-2 px-4 text-right">' + item.score + '</td>\n'
    html += '<td class="py-2 px-4 text-right">R' + item.round + '</td>\n'
    html += '</tr>\n'
  })

  html += '</tbody>\n'
  html += '</table>\n'
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
    let html = '<h2 class="mb-4">Championship Standings</h2>\n'
    html += '<div class="mb-8 overflow-x-auto">\n'
    html += '<div style="" class="w-full h-[500px] sm:h-[600px] md:h-[700px]">\n'
    html += '<canvas id="lapChart"></canvas>\n'
    html += '</div>\n'
    html += '</div>\n'
    html += '<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 mt-12">\n'
    html += '<div class="overflow-x-auto">\n'
    html += '<h2 class="mb-4">Points Progression</h2>\n'
    html += '<div style="" class="w-full h-[500px] sm:h-[600px]">\n'
    html += '<canvas id="pointsProgressionChart"></canvas>\n'
    html += '</div>\n'
    html += '</div>\n'
    html += '<div class="overflow-x-auto">\n'
    html += '<h2 class="mb-4">Points by Round</h2>\n'
    html += '<div style="" class="w-full h-[500px] sm:h-[600px]">\n'
    html += '<canvas id="stackedPointsChart"></canvas>\n'
    html += '</div>\n'
    html += '</div>\n'
    html += '</div>\n'
    html += '<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8 mt-12">\n'
    html += createStandings(racers, racePositions)
    html += createTopScores(racers)
    html += createLowestScores(racers)
    html += '</div>\n'
    html += '<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">\n'
    html += '<div class="overflow-x-auto">\n'
    html += '<h2 class="mb-4 text-left">Brand Points Distribution</h2>\n'
    html += '<div style="" class="w-full h-[400px] sm:h-[500px]">\n'
    html += '<canvas id="brandPieChart"></canvas>\n'
    html += '</div>\n'
    html += '</div>\n'
    html += '<div class="overflow-x-auto">\n'
    html += '<h2 class="mb-4 text-left">Brand Podium Finishes</h2>\n'
    html += '<div style="" class="w-full h-[400px] sm:h-[500px]">\n'
    html += '<canvas id="brandPodiumChart"></canvas>\n'
    html += '</div>\n'
    html += '</div>\n'
    html += '</div>\n'
    html += createBrandRoster(racers)
    html += createBrandPoints(racers, racePositions)
    html += '<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8 mt-12">\n'
    html += createResultsGrid(racers, racePositions)
    html += createRoundResults(racers, racePositions)
    html += '</div>\n'

    app.innerHTML = html

    // Create the charts after DOM is ready
    createPointsProgressionChart(racers)
    createStackedPointsChart(racers)
    createBrandPieChart(racers)
    createBrandPodiumChart(racers, racePositions)
    createBumpChart(racers, championshipPositions)
  } catch (error) {
    app.innerHTML = '<p class="text-red-400">Error loading data: ' + error.message + '</p>'
    console.error(error)
  }
}

init()

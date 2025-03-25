import { readFileSync } from 'fs'

interface ConferenceEntry {
  startDate: string
  endDate: string
  location: string
  price: number
}

function readLines(filename: string): string[] {
  try {
    const content = readFileSync(filename, 'utf8').trim()
    return content ? content.split('\n').map(line => line.trim()) : []
  } catch (error) {
    console.error(`Error reading ${filename}:`, error)
    return []
  }
}

function parseDate(dateStr: string): string {
  const currentYear = 2025
  const months: { [key: string]: string } = {
    'January': '01', 'February': '02', 'March': '03', 'April': '04',
    'May': '05', 'June': '06', 'July': '07', 'August': '08',
    'September': '09', 'October': '10', 'November': '11', 'December': '12'
  }

  const parts = dateStr.trim().split(' ')
  const day = parts[0].padStart(2, '0')
  const month = months[parts[1]] || '01'

  return `${currentYear}-${month}-${day}`
}

function isDateInFuture(dateStr: string): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  return date > now
}

function processInputs(): ConferenceEntry[] {
  const startDates = readLines('start_dates.txt')
  const endDates = readLines('end_dates.txt')
  const locations = readLines('locations.txt')
  const prices = readLines('prices.txt')

  if (startDates.length === 0 || locations.length === 0) {
    throw new Error('Start dates and locations are required')
  }

  if (startDates.length !== locations.length) {
    throw new Error('Number of start dates must match number of locations')
  }

  return startDates.map((startDate, index) => {
    // Parse start date
    const parsedStartDate = parseDate(startDate)

    // Parse end date (use start date if not provided)
    const endDate = endDates[index]
    const parsedEndDate = endDate ? parseDate(endDate) : parsedStartDate

    // Get location
    const location = locations[index]

    // Parse price (default to 0)
    const price = prices[index] ? parseFloat(prices[index].replace(/[^0-9.-]+/g, '')) || 0 : 0

    return {
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      location,
      price
    }
  })
}

function generateMatrix(): string {
  const entries = processInputs()

  // Filter out past events
  const futureEntries = entries.filter(entry => isDateInFuture(entry.startDate))

  // Create matrix configuration
  const matrix = {
    include: futureEntries
  }

  // Output as JSON
  return JSON.stringify(matrix, null, 2)
}

// Generate and output matrix configuration
console.log(generateMatrix())

# Flight Price Analytics System

## Overview
This document details our automated flight price collection and analysis system, focusing on urgency premium analysis with an intelligent route rotation system. The system leverages GitHub Actions to efficiently collect and analyze flight pricing data, with a specific focus on understanding urgency premiums across different routes.

## Core Components

### 1. Urgency Premium Analysis
This is our primary focus, analyzing how flight prices change based on booking time proximity:
- Fixed 7-day trip duration
- Rolling collection window (0-19 days from current date)
- 20 concurrent jobs (GitHub Actions free tier maximum)
- Consistent base route for clean data analysis

### 2. Route Prioritization System

#### Scoring Components
- Flight Frequency (30%): Daily flight count and weekly patterns
- Competition Level (25%): Number of carriers and route competition
- Route Demand (25%): Search volume and historical demand
- Seasonal Factors (20%): Seasonal variations and peak periods

#### Route Tiers
1. Japan Routes (Score: 90-100)
   - ICN-NRT (Tokyo Narita)
   - ICN-HND (Tokyo Haneda)
   - ICN-KIX (Osaka)
   - ICN-CTS (Sapporo)
   - ICN-FUK (Fukuoka)

2. East Asia Routes (Score: 80-89)
   - ICN-PVG (Shanghai)
   - ICN-PEK (Beijing)
   - ICN-HKG (Hong Kong)
   - ICN-TPE (Taipei)
   - ICN-MNL (Manila)

3. SE Asia Routes (Score: 70-79)
   - ICN-BKK (Bangkok)
   - ICN-SGN (Ho Chi Minh)
   - ICN-SIN (Singapore)
   - ICN-KUL (Kuala Lumpur)
   - ICN-CGK (Jakarta)

## Technical Implementation

### 1. Route Scoring System

```typescript
interface RouteScore {
  from: string;
  to: string;
  baseScore: number;
  metrics: {
    frequency: FlightFrequency;
    competition: AirlineCompetition;
    demand: RoutePopularity;
    seasonality: SeasonalImpact;
  };
  historicalData?: {
    priceVolatility: number;
    dataCoverage: number;
    reliability: number;
  };
}

interface FlightFrequency {
  dailyFlights: number;     // 0-50+ flights
  weeklyPattern: {          // Coverage throughout week
    weekday: number;        // % of expected flights
    weekend: number;
  };
  score: number;            // 0-100
}

interface AirlineCompetition {
  carriers: number;         // Number of airlines
  lowCostPresence: number;  // LCC competition factor
  directFlights: number;    // % direct vs. connections
  score: number;            // 0-100
}
```

### 2. Score Calculation

```typescript
class RouteScoreCalculator {
  private static readonly WEIGHTS: ScoreWeights = {
    frequency: 0.30,
    competition: 0.25,
    demand: 0.25,
    seasonality: 0.20
  };

  calculateRouteScore(metrics: RouteMetrics): number {
    const frequencyScore = this.calculateFrequencyScore(metrics.frequency);
    const competitionScore = this.calculateCompetitionScore(metrics.competition);
    const demandScore = this.calculateDemandScore(metrics.demand);
    const seasonalityScore = this.calculateSeasonalityScore(metrics.seasonality);

    return (
      frequencyScore * this.WEIGHTS.frequency +
      competitionScore * this.WEIGHTS.competition +
      demandScore * this.WEIGHTS.demand +
      seasonalityScore * this.WEIGHTS.seasonality
    );
  }
}
```

## Data Organization

### Directory Structure
```
data/
  routes/
    ICN-NRT/
      urgency-premium/
        2025-03/
          raw/             # Raw flight data
          processed/       # Analyzed results
      metadata.json       # Route-specific metadata
    ICN-HND/
      ...
```

### Workflow Organization
```
.github/
  workflows/
    urgency-premium.yml   # Primary analysis workflow
    route-scheduler.yml   # Route rotation manager
    data-collector.yml    # Artifact handling
```

## GitHub Actions Implementation

### 1. Route Scheduler
```yaml
name: Route Scheduler
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  schedule:
    runs-on: ubuntu-latest
    steps:
      - name: Check out code
        uses: actions/checkout@v3

      - name: Update current route
        run: |
          # Read routes.json and select next route
          # Update current-route.json
          # Trigger appropriate analysis workflow
```

### 2. Urgency Premium Analysis
```yaml
name: Urgency Premium Analysis
on:
  workflow_dispatch:
  schedule:
    - cron: '0 */6 * * *'

jobs:
  analyze:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        days_from_now: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]

    steps:
      - name: Analyze prices
        run: |
          # Run price analysis for specific day offset
          # Store results in artifacts
```

## Usage

### Running Analysis
```bash
# Start urgency premium analysis
npm run analyze:urgency

# View current route status
npm run route:status

# Generate route reports
npm run report:generate
```

### Viewing Results
- Dashboard: http://localhost:3000
- Data exports: /data/exports/
- Analysis reports: /reports/

## Maintenance

### Route Updates
1. Modify `routes.json` with new routes/scores
2. System automatically includes in next rotation
3. Scores auto-adjust based on collected data

### Score Recalculation
```bash
# Recalculate all route scores
npm run recalculate:scores

# Update specific route
npm run update:route ICN-NRT
```

## Future Extensions

1. Additional Analysis Types:
   - Seasonal trends analysis
   - Weekend premium detection
   - Holiday impact studies
   - Multi-city route comparison

2. Enhanced Data Collection:
   - Multiple trip durations
   - Fare class analysis
   - Competitor price tracking
   - Historical trend modeling

3. Advanced Features:
   - Price prediction modeling
   - Automated alert system
   - Dynamic route prioritization
   - Cross-route correlation analysis

## Contributing

1. Adding Routes:
   - Update `routes.json`
   - Provide initial metrics
   - Include historical data if available

2. Improving Analytics:
   - Enhance scoring algorithms
   - Add new analysis types
   - Optimize data collection

3. Development Guidelines:
   - Follow TypeScript conventions
   - Include unit tests
   - Update documentation

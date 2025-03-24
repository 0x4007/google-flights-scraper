# Flight Search Results DOM Structure

This document provides a comprehensive representation of the DOM structure for a flight search results interface, with special emphasis on preserving ARIA labels and accessibility information.

## Overview

The DOM represents a flight search results page showing flights from Seoul to Tokyo, with 9 results organized into different categories. The interface includes sorting options, flight details, pricing information, and environmental impact data.

## Main Structure

```
div (root)
├── h2 "Search results"
├── div "9 results returned."
└── div (results container)
    ├── div (tab navigation)
    │   ├── div#Oacf4b "Best" (tab, tabindex="0")
    │   └── div#M7sBEb "Cheapest" (tab, tabindex="-1")
    │       └── div "from $338"
    ├── div (Best results section, aria-labelledby="Oacf4b")
    │   ├── h3 "Top departing flights" (tabindex="-1")
    │   ├── div
    │   │   └── span "Ranked based on price and convenience"
    │   └── ul (flight listings)
    │       └── li (flight items)
    └── div (Cheapest results section, aria-labelledby="M7sBEb")
```

## Flight Listing Structure

Each flight listing follows this general structure:

```
li
└── div (flight item container)
    ├── div (aria-label="[Complete flight details]", tabindex="0")
    ├── div (flight details container)
    │   ├── div (times and airline)
    │   │   ├── span (departure-arrival times, aria-label="[Full time details]")
    │   │   └── div (airline information)
    │   ├── div (duration and airports)
    │   │   ├── div (duration, aria-label="Total duration X hr Y min")
    │   │   └── span (airport codes)
    │   ├── div (stops information)
    │   │   └── span (aria-label="[Stop details]")
    │   ├── div (emissions information)
    │   │   └── div (emissions details, aria-label="[Emissions details]")
    │   └── div (price information)
    │       └── span (aria-label="[Price in dollars]")
    └── div (flight details toggle button)
        └── button (aria-label="Flight details. [Flight timing details]")
```

## ARIA Labels

The interface makes extensive use of ARIA labels to provide accessibility information. Key patterns include:

1. **Flight summaries**: Comprehensive labels that contain all critical information in one attribute:

   ```
   aria-label="From 386 US dollars round trip total. Nonstop flight with Asiana Airlines. Leaves Incheon International Airport at 6:30 PM on Monday, March 31 and arrives at Narita International Airport at 9:00 PM on Monday, March 31. Total duration 2 hr 30 min. Select flight"
   ```

2. **Time information**: Detailed labels for departure and arrival times:

   ```
   aria-label="Departure time: 6:30 PM."
   aria-label="Arrival time: 9:00 PM."
   ```

3. **Duration information**:

   ```
   aria-label="Total duration 2 hr 30 min."
   ```

4. **Stop details**:

   ```
   aria-label="Nonstop flight."
   aria-label="1 stop flight."
   aria-label="Layover (1 of 1) is a 4 hr 30 min layover at Chubu Centrair International Airport in Nagoya."
   ```

5. **Environmental impact**:

   ```
   aria-label="Carbon emissions estimate: 118 kilograms. -6% emissions. Learn more about this emissions estimate"
   ```

6. **Price information**:

   ```
   aria-label="386 US dollars"
   ```

7. **Button actions**:
   ```
   aria-label="Select flight"
   aria-label="Flight details. Leaves Incheon International Airport at 6:30 PM..."
   ```

## Dialog/Modal Accessibility

The interface includes informational dialogs with appropriate ARIA attributes:

```
div (aria-modal="true")
└── div (dialog content)
    └── button (aria-label="Close dialog")
```

## Flight Information Categories

### 1. Basic Flight Details

- **Price**: Displayed in USD (e.g., "$386 round trip")
- **Airlines**: Carrier names (e.g., "Asiana Airlines", "JAL")
- **Times**: Departure and arrival times with dates
- **Duration**: Total flight time
- **Route**: Origin and destination airports with codes

### 2. Stop Information

- **Nonstop**: Directly indicated as "Nonstop"
- **Stops**: Number of stops with layover durations
- **Layover details**: Airport name, location, and duration

### 3. Environmental Impact

- **CO2 emissions**: Amount in kg CO2e
- **Relative impact**: Percentage comparison to average (-6%, +344%, etc.)
- **Environmental benefits**: e.g., "Avoids as much CO2e as 487 trees absorb in a day"

### 4. Additional Features

- **Sorting options**: "Best" and "Cheapest"
- **Price tracking**: Toggle buttons to track prices
- **View options**: Date grid and price graph buttons
- **Flight details expansion**: Toggle buttons to show more information

## Important UI Patterns

### Tab Structure

The search results use a tab interface to organize flights by category:

- "Best" tab (default selected): Flights ranked by balanced price and convenience
- "Cheapest" tab: Flights ranked purely by lowest price

### Expandable Content

Flight listings can be expanded to show additional details via a toggle button.

### Hover Information

Many elements have tooltip-style information revealed on hover or focus, indicated by:

```
<span tabindex="0">
    <span><svg>...</svg></span>
</span>
```

### Tracking Features

The interface allows users to track prices with toggles:

```
<button aria-checked="false" aria-label="Track prices from Seoul to Tokyo...">
```

## Accessibility Implementation Notes

1. The interface follows a hierarchical structure with clear ARIA relationships (aria-labelledby, etc.)
2. Interactive elements have appropriate tabindex values
3. Non-text content has text alternatives via aria-label
4. Modal dialogs are properly identified with aria-modal="true"
5. Group relationships are established using appropriate ARIA attributes
6. Hidden content is properly marked with aria-hidden="true"

This structure provides a comprehensive view of how flight search results are organized with accessibility in mind, offering a template for implementing similar interfaces with proper semantic markup and ARIA attributes.

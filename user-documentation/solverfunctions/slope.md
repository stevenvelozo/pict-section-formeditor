# slope

Calculates the slope of a linear regression line through paired data points.

## Syntax

```
slope(yValues, xValues)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `yValues` | Array | Array of y-coordinates (dependent variable) |
| `xValues` | Array | Array of x-coordinates (independent variable) |

## Returns

Number - The slope of the best-fit regression line.

## Description

The `slope` function calculates the slope of a linear regression line through a set of paired data points. It is equivalent to Excel's SLOPE function.

The slope represents the rate of change in the dependent variable (y) for each unit change in the independent variable (x). The formula used is:

```
slope = (n * SUM(xy) - SUM(x) * SUM(y)) / (n * SUM(x^2) - (SUM(x))^2)
```

The function accepts flexible calling conventions:

- **Two arrays**: `SLOPE(yArray, xArray)`
- **Inline scalars**: `SLOPE(y1, y2, ..., yN, x1, x2, ..., xN)` where the arguments are split in half

Returns `0` when fewer than two data points are provided or when the denominator is zero (all x-values are identical).

## Examples

### Basic Usage

```expression
// Perfect linear relationship: y = 2x
Result = SLOPE([2, 4, 6, 8, 10], [1, 2, 3, 4, 5])
// Returns: 2
```

### Sales Trend

```expression
// Calculate monthly sales growth rate
Months = [1, 2, 3, 4, 5, 6]
Sales = [1000, 1200, 1350, 1500, 1700, 1900]
GrowthRate = SLOPE(Sales, Months)
// Returns: ~178 (sales increase per month)
```

### Combined with Intercept

```expression
// Build a full linear model: y = slope * x + intercept
TrendSlope = SLOPE(SalesData, MonthNumbers)
TrendIntercept = INTERCEPT(SalesData, MonthNumbers)
// Predict month 12: Prediction = TrendSlope * 12 + TrendIntercept
```

## Use Cases

- **Trend analysis**: Determine rate of change over time
- **Forecasting**: Calculate growth or decline rates for projections
- **Correlation**: Measure direction and steepness of linear relationships
- **Spreadsheet compatibility**: Excel SLOPE equivalent

## Related Functions

- [intercept](./intercept.md) - Y-intercept of the regression line
- [leastsquares](./leastsquares.md) - Full regression results (slope, intercept, and statistics)
- [linest](./linest.md) - Alternative linear estimation (alias for leastsquares)
- [predict](./predict.md) - Predict values using regression coefficients

## Notes

- Argument order is `(yValues, xValues)`, matching the Excel SLOPE convention
- Uses arbitrary-precision arithmetic internally
- Returns `0` for degenerate cases (fewer than 2 points or all x-values equal)

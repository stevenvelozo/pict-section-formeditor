# intercept

Calculates the y-intercept of a linear regression line through paired data points.

## Syntax

```
intercept(yValues, xValues)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `yValues` | Array | Array of y-coordinates (dependent variable) |
| `xValues` | Array | Array of x-coordinates (independent variable) |

## Returns

Number - The y-intercept of the best-fit regression line.

## Description

The `intercept` function calculates the y-intercept of a linear regression line through a set of paired data points. It is equivalent to Excel's INTERCEPT function.

The y-intercept is the predicted value of y when x is zero. The formula used is:

```
intercept = mean(y) - slope * mean(x)
```

The function accepts flexible calling conventions:

- **Two arrays**: `INTERCEPT(yArray, xArray)`
- **Inline scalars**: `INTERCEPT(y1, y2, ..., yN, x1, x2, ..., xN)` where the arguments are split in half

## Examples

### Basic Usage

```expression
// y = 2x + 0 (intercept is 0)
Result = INTERCEPT([2, 4, 6, 8, 10], [1, 2, 3, 4, 5])
// Returns: 0
```

### With Non-Zero Intercept

```expression
// y = 2x + 3
Result = INTERCEPT([5, 7, 9, 11, 13], [1, 2, 3, 4, 5])
// Returns: 3
```

### Building a Linear Model

```expression
// Calculate both slope and intercept for prediction
TrendSlope = SLOPE(SalesData, MonthNumbers)
TrendIntercept = INTERCEPT(SalesData, MonthNumbers)
// Predict sales for month 12
PredictedSales = TrendSlope * 12 + TrendIntercept
```

### Baseline Value

```expression
// Find the baseline cost (cost at zero units)
BaseCost = INTERCEPT(TotalCosts, UnitsProduced)
// BaseCost represents fixed costs independent of production volume
```

## Use Cases

- **Baseline estimation**: Determine the starting value when the independent variable is zero
- **Forecasting**: Combine with slope for linear predictions
- **Cost analysis**: Separate fixed costs from variable costs
- **Spreadsheet compatibility**: Excel INTERCEPT equivalent

## Related Functions

- [slope](./slope.md) - Slope of the regression line
- [leastsquares](./leastsquares.md) - Full regression results (slope, intercept, and statistics)
- [linest](./linest.md) - Alternative linear estimation (alias for leastsquares)
- [predict](./predict.md) - Predict values using regression coefficients

## Notes

- Argument order is `(yValues, xValues)`, matching the Excel INTERCEPT convention
- Uses arbitrary-precision arithmetic internally
- Internally computes the slope first, then derives the intercept

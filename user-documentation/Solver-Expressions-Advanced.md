# Solver Expressions Advanced Topics

This article covers scope rules, tabular group solvers, data creation, set operations, MAP/SERIES expressions, and ordinal-based execution control.

## Scope: Global Form vs Tabular Group

Understanding scope is essential for writing correct solver expressions.

### Global Form Scope (Section Solvers)

Section-level solvers operate in the global form scope. They can read and write any input address in the form. When a section solver references a hash like `Price`, it resolves to the top-level form data.

```
Total = Price * Quantity
```

This reads `Price` and `Quantity` from the form's AppData and writes `Total` back to the form's AppData.

Section solvers can also read from the broader application state using `getvalue`:

```
TaxRate = getvalue("AppData.Settings.TaxRate")
```

### Tabular/RecordSet Scope (Group Solvers)

Tabular and RecordSet groups have their own solver arrays (`RecordSetSolvers`). These solvers execute once per row in the data set. Inside a group solver, hash references resolve to the current row's data rather than the global form.

For example, if a Tabular group displays rows from `AppData.LineItems` and each row has `Price`, `Quantity`, and `LineTotal` fields, a group solver like:

```
LineTotal = Price * Quantity
```

runs for each row individually. `Price` refers to that row's price, not a global form input. The result `LineTotal` is written back to that same row.

### Crossing Scope Boundaries

Group solvers can access global form data using `getvalue`:

```
LineTotal = Price * Quantity * (1 + getvalue("AppData.FormData.TaxRate"))
```

Conversely, section solvers can aggregate data from tabular groups using array-aware functions:

```
OrderTotal = sum(flatten(getvalue("AppData.LineItems[].LineTotal")))
```

The `[]` syntax in `getvalue` gathers a value from every element of the array.

## Creating Data in Scope

Solver expressions can create new data that did not exist in the original form inputs. When you assign to a hash that is not a declared input, the value is stored in the solver's destination object and is available to subsequent solvers.

```
TaxAmount = Subtotal * TaxRate
GrandTotal = Subtotal + TaxAmount
```

Even if `TaxAmount` is not a form input, the second expression can still reference it because it was created by the first expression in the same solver pass.

### Writing to Application State

Use `setvalue` to write data to a specific path in the application state:

```
setvalue("AppData.Computed.OrderSummary.Total", GrandTotal)
```

This is useful for making computed results available to other parts of the application, not just the form.

### Null Coalescence for Defaults

Use `?=` to set initial values without overwriting existing data:

```
DefaultShipping ?= 5.99
DefaultCurrency ?= "USD"
```

These only write if the target is currently empty, so user edits are preserved.

## Set Operations and Array Manipulation

Many solver functions work with arrays (called "sets" in the expression language). These are essential for working with lists of data.

### Building Arrays

The comma operator creates a set from individual values:

```
Colors = "Red", "Green", "Blue"
```

Use `flatten` to extract arrays from nested data:

```
AllCities = flatten(getvalue("AppData.Regions[].Cities[].Name"))
```

Use `getvaluearray` to gather specific paths into a single array:

```
KeyMetrics = getvaluearray("AppData.Revenue", "AppData.Costs", "AppData.Profit")
```

### Filtering and Transforming

`uniquearray` removes duplicates:

```
UniqueStates = uniquearray(AllStates)
```

`sortarray` sorts values:

```
SortedNames = sortarray(AllNames)
```

`slice` extracts a portion:

```
TopFive = slice(SortedScores, 0, 5)
```

### Set Algebra

Combine or compare arrays:

```
AllMembers = unionarrays(TeamA, TeamB)
OnlyInA = differencearrays(TeamA, TeamB)
```

### Searching

Find specific values in arrays of objects:

```
FoundCity = findfirstvaluebyexactmatch(getvalue("AppData.Cities"), "state", "Colorado", "city")
```

This searches the Cities array for the first entry where `state` equals `"Colorado"` and returns its `city` field.

```
MatchIndex = match("Denver", CityNames)
```

This returns the zero-based index of `"Denver"` in the array, similar to a spreadsheet MATCH function.

## MAP Expressions

MAP transforms each element of an array using an expression:

```
Result = MAP VAR x FROM Values : x * 2
```

Given `Values = [1, 2, 3, 4, 5]`, this produces `[2, 4, 6, 8, 10]`.

Multiple variables iterate in parallel:

```
Distances = MAP VAR lat FROM Latitudes VAR lon FROM Longitudes : sqrt(lat^2 + lon^2)
```

MAP is powerful for transforming tabular data, computing derived columns, or preparing data for charts.

## SERIES Expressions

SERIES generates a sequence of computed values over a numeric range:

```
XValues = SERIES FROM 0 TO 100 STEP 5 : n
```

This produces `[0, 5, 10, 15, ..., 100]`. The variable `n` holds the current step value, and `stepIndex` holds the zero-based index.

```
Curve = SERIES FROM 0 TO 10 STEP 0.5 : n^2 + 2*n + 1
```

Series variables (FROM, TO, STEP) can reference other solver values:

```
DataPoints = SERIES FROM StartX TO EndX STEP Resolution : BaseValue + (n * Slope)
```

## Ordinal-Based Execution Control

### Multi-Pass Computation

Ordinals let you organize solvers into execution phases:

- **Ordinal 1** (default): Core calculations — compute raw values
- **Ordinal 2**: Derived calculations — aggregate results from ordinal 1
- **Ordinal 3**: UI updates — color cells, show/hide sections based on computed values

### Dynamic Ordinal Control

You can enable or disable entire ordinals at runtime:

```
disablesolverordinal(3)
```

This prevents all ordinal-3 solvers from executing. Re-enable them later:

```
enablesolverordinal(3)
```

Or conditionally toggle based on form state:

```
setsolverordinalenabled(2, IsAdvancedMode)
```

This is useful for performance optimization — skip expensive calculations when their results are not needed.

## Form UI Control from Solvers

Solvers can directly control form appearance and visibility.

### Section and Group Visibility

Show or hide parts of the form based on data:

```
setsectionvisibility("AdvancedOptions", ShowAdvanced)
setsectionvisibility("BasicOptions", if(ShowAdvanced, "==", "true", "0", "1"))
```

For bulk operations:

```
showsections(VisibleSections)
hidesections(HiddenSections)
```

Where `VisibleSections` and `HiddenSections` are arrays of section hashes.

### Conditional Coloring

Highlight cells or sections based on computed values:

```
AlertColor = if(Total, ">", Budget, "#FFE0E0", "#E0FFE0")
colorsectionbackground("Summary", AlertColor)
```

For individual inputs:

```
colorinputbackground("S1", "Total", if(Total, ">", Budget, "#FF0000", "#000000"))
```

For tabular cells, specify the row index:

```
colorinputbackgroundtabular("Data", "DataGroup", "Status", RowIndex, StatusColor)
```

### Tabular Row Management

Control the number of rows in a tabular group:

```
settabularrowlength("DataSection", "DataGroup", DesiredRowCount)
```

After modifying tabular data, force a display refresh:

```
refreshtabularsection("DataSection", "DataGroup")
```

## Histogram and Aggregation

Histograms group and summarize data by field values.

### Distribution Histogram

Count occurrences of each unique value:

```
StateCounts = distributionhistogram("AppData.Cities", "state")
```

Result: `{ "Colorado": 21, "New York": 15, "California": 42, ... }`

### Aggregation Histogram

Sum a numeric field grouped by a category:

```
PopulationByState = aggregationhistogram("AppData.Cities", "state", "population")
```

Result: `{ "Colorado": "5773714", "New York": "19453561", ... }`

### Working with Histogram Results

Extract keys and values for charting:

```
StateNames = objectkeystoarray(StateCounts)
StateValues = objectvaluestoarray(StateCounts)
SortedHistogram = sorthistogram(StateCounts)
```

## Regression and Prediction

Fit models to data and make predictions:

```
Coefficients = linest(flatten(getvalue("AppData.XData")), flatten(getvalue("AppData.YData")))
PredictedY = predict(Coefficients, NewXValue)
```

For polynomial regression:

```
PolyCoefficients = polynomialregression(XValues, YValues, 3)
```

## Debugging Expressions

Use `logvalues` to print intermediate values to the browser console:

```
Debug = logvalues("Tax:", TaxRate, "Subtotal:", Subtotal, "Total:", Total)
```

This logs each value and returns the last one. It helps track down issues in complex solver chains.

## Next Steps

- Browse the [Solver Functions](Solver-Functions.md) reference for every available function
- Review the [Solver Expression Walkthrough](Solver-Expression-Walkthrough.md) for basics
- Return to the [Table of Contents](ToC.md)

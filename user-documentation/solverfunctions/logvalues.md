# logvalues

Logs values to the browser console and returns the last value. Useful for debugging solver expressions.

## Syntax

```
logvalues(val1, val2, ...)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `val1` | Any | First value to log |
| `val2` | Any | Second value to log |
| `...` | Any | Additional values to log |

## Returns

The last value passed to the function.

## Description

The `logvalues` function outputs each of its arguments to the browser developer console, then returns the last argument. This is primarily a debugging tool that lets you inspect intermediate values in solver expressions without disrupting the expression chain. Since it returns the last value, it can be inserted into expressions to observe values at any point during evaluation.

## Examples

### Debugging a calculation

```expression
Debug = logvalues(Price, Quantity, Total)
// Logs Price, Quantity, and Total to the console; Debug is set to Total
```

### Inspecting a single value

```expression
Check = logvalues(SomeComputedValue)
// Logs SomeComputedValue to the console and returns it
```

### Tracing multiple intermediate values

```expression
Trace = logvalues("Step1", RawPrice, "Step2", AdjustedPrice, "Final", FinalPrice)
// Logs all six arguments; Trace is set to FinalPrice
```

## Use Cases

- **Debugging solvers**: Inspect values during solver execution to verify correctness of intermediate calculations
- **Tracing data flow**: Log multiple related values to understand how data flows through expressions
- **Temporary inspection**: Drop into an expression temporarily to check a value, then remove when done

## Related Functions

- [setvalue](./setvalue.md) - Sets a value in the application state

## Notes

- Accepts any number of arguments
- Always returns the last argument passed
- Output appears in the browser developer console (open with F12 or Ctrl+Shift+I)
- Intended for development and debugging; consider removing from production solver expressions

# setvalue

Sets a value in the application state at the specified path.

## Syntax

```
setvalue(address, value)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `address` | String | Dot-notation path to the state location (must be quoted) |
| `value` | Any | The value to set at the specified path |

## Returns

Void. This function does not return a value.

## Description

The `setvalue` function writes a value into the application state at the location specified by the address parameter. The address uses dot-notation to identify the path within the state object. This function is essential for solver expressions that need to store calculated results, update form fields, or modify application state based on computed values. The address parameter must be a quoted string.

## Examples

### Setting a calculated total

```expression
setvalue("AppData.TotalPrice", Price * Quantity)
// Sets the TotalPrice field in AppData to the product of Price and Quantity
```

### Setting a status flag

```expression
setvalue("FormState.IsComplete", true)
// Sets the IsComplete flag to true
```

### Setting a nested value

```expression
setvalue("Order.Summary.GrandTotal", Subtotal + Tax + Shipping)
// Sets a deeply nested value in the application state
```

## Use Cases

- **Storing calculations**: Write the results of solver calculations back into the application state
- **Updating form fields**: Programmatically set the value of form inputs
- **Managing state flags**: Set boolean flags or status values based on form conditions
- **Cross-section data sharing**: Write values that can be read by other sections or solvers

## Related Functions

- [logvalues](./logvalues.md) - Logs values to the browser console for debugging

## Notes

- The address must be a quoted string using dot-notation (e.g., `"AppData.Field"`)
- The value can be any type: string, number, boolean, array, or object
- Setting a value does not automatically trigger a solver re-run
- The path will be created if it does not already exist in the state

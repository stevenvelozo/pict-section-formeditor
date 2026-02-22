# differencearrays

Returns values in the first array that are not in the second array (set difference).

## Syntax

```
differencearrays(array1, array2)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `array1` | Array | The array to filter |
| `array2` | Array | The array of values to exclude |

## Returns

A new array containing only the values from `array1` that do not appear in `array2`.

## Description

The `differencearrays` function performs a set difference operation. It returns a new array containing every element from the first array that is not present in the second array. This is useful for finding items that exist in one list but not another, such as identifying incomplete tasks or missing items.

## Examples

### Finding incomplete items

```expression
OnlyInA = differencearrays(AllItems, CompletedItems)
// If AllItems is ["A", "B", "C", "D"] and CompletedItems is ["B", "D"],
// OnlyInA is ["A", "C"]
```

### Filtering out excluded options

```expression
Available = differencearrays(AllOptions, ExcludedOptions)
// Returns only the options that have not been excluded
```

## Use Cases

- **Tracking incomplete work**: Find items in a full list that are not in a completed list
- **Filtering exclusions**: Remove specific entries from a list based on another list
- **Identifying missing data**: Determine which expected values are absent from a dataset

## Related Functions

- [unionarrays](./unionarrays.md) - Returns all unique values from both arrays
- [uniquearray](./uniquearray.md) - Removes duplicates from a single array
- [sortarray](./sortarray.md) - Returns a sorted copy of an array

## Notes

- Both parameters must be arrays
- The operation is directional: `differencearrays(A, B)` is not the same as `differencearrays(B, A)`
- Duplicate values in `array1` that are not in `array2` may still appear in the result

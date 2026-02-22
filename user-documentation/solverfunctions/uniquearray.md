# uniquearray

Returns a new array with duplicate values removed.

## Syntax

```
uniquearray(array)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `array` | Array | The array to deduplicate |

## Returns

A new array containing only the unique values from the input array.

## Description

The `uniquearray` function takes an array and returns a new array with all duplicate values removed. Each value in the resulting array appears exactly once. This is useful for cleaning up lists that may contain repeated entries.

## Examples

### Removing duplicate states

```expression
UniqueStates = uniquearray(AllStates)
// If AllStates is ["NY", "CA", "NY", "TX", "CA"],
// UniqueStates is ["NY", "CA", "TX"]
```

### Deduplicating collected values

```expression
CleanList = uniquearray(RawInputList)
// Returns the list with all duplicates removed
```

## Use Cases

- **Cleaning data**: Remove duplicate entries from a list of collected values
- **Building option lists**: Create a list of distinct values for dropdowns or selection controls
- **Preparing data for display**: Ensure a list shown to the user contains no repeated items

## Related Functions

- [unionarrays](./unionarrays.md) - Returns all unique values from both arrays
- [differencearrays](./differencearrays.md) - Returns values in one array that are not in another
- [sortarray](./sortarray.md) - Returns a sorted copy of an array

## Notes

- The input must be an array
- The order of first appearance is generally preserved
- Comparison is based on value equality

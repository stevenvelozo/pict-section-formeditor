# unionarrays

Returns a new array containing all unique values from both input arrays (set union).

## Syntax

```
unionarrays(array1, array2)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `array1` | Array | The first array |
| `array2` | Array | The second array |

## Returns

A new array containing all unique values from both input arrays.

## Description

The `unionarrays` function performs a set union operation on two arrays. It combines both arrays and removes any duplicate values, returning a new array that contains every distinct value present in either input array. This is useful for merging lists while ensuring no value appears more than once.

## Examples

### Combining two teams

```expression
Combined = unionarrays(TeamA, TeamB)
// If TeamA is ["Alice", "Bob"] and TeamB is ["Bob", "Carol"],
// Combined is ["Alice", "Bob", "Carol"]
```

### Merging selected options

```expression
AllSelections = unionarrays(PreviousSelections, NewSelections)
// Combines both selection lists with no duplicates
```

## Use Cases

- **Merging lists**: Combine two lists of items while eliminating duplicates
- **Accumulating selections**: Merge newly selected items with previously selected items
- **Building unique sets**: Create a comprehensive list from multiple sources

## Related Functions

- [differencearrays](./differencearrays.md) - Returns values in one array that are not in another
- [uniquearray](./uniquearray.md) - Removes duplicates from a single array
- [sortarray](./sortarray.md) - Returns a sorted copy of an array

## Notes

- Both parameters must be arrays
- The returned array contains no duplicate values
- The order of elements in the result is not guaranteed to match either input

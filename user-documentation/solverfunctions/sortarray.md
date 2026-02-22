# sortarray

Returns a sorted copy of the array.

## Syntax

```
sortarray(array)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `array` | Array | The array to sort |

## Returns

A new array with the elements sorted in ascending order.

## Description

The `sortarray` function takes an array and returns a new array with its elements sorted in ascending order. The original array is not modified. This is useful for ordering lists of values for display or further processing.

## Examples

### Sorting scores

```expression
Sorted = sortarray(Scores)
// If Scores is [85, 42, 97, 63],
// Sorted is [42, 63, 85, 97]
```

### Sorting names alphabetically

```expression
OrderedNames = sortarray(NameList)
// Returns the names in alphabetical order
```

## Use Cases

- **Ordering data for display**: Sort a list of values before presenting them to the user
- **Ranking**: Arrange numeric values in order for ranking or comparison
- **Alphabetizing**: Sort string values into alphabetical order

## Related Functions

- [uniquearray](./uniquearray.md) - Removes duplicates from an array
- [unionarrays](./unionarrays.md) - Returns all unique values from both arrays
- [differencearrays](./differencearrays.md) - Returns values in one array that are not in another

## Notes

- The input must be an array
- The original array is not modified; a new sorted array is returned
- Sorting behavior follows standard JavaScript sort ordering

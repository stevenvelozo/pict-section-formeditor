# settabularrowlength

Sets the number of rows in a tabular data group.

## Syntax

```
settabularrowlength(sectionHash, groupHash, length)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `sectionHash` | String | The hash identifier of the section containing the tabular group |
| `groupHash` | String | The hash identifier of the tabular group |
| `length` | Integer | The desired number of rows |

## Returns

Void. This function does not return a value.

## Description

The `settabularrowlength` function sets the number of rows in a tabular data group to the specified length. If the current number of rows is less than the specified length, new rows are added. If the current number is greater, excess rows may be removed depending on the optional fourth parameter. This function is useful for programmatically controlling the size of tabular data sections based on external data or user input.

## Examples

### Setting a table to 10 rows

```expression
settabularrowlength("DataSection", "DataGroup", 10)
// Sets the DataGroup table in DataSection to have exactly 10 rows
```

### Setting row count with deletion of extra rows

```expression
settabularrowlength("Orders", "LineItems", RequiredRows, true)
// Sets the row count and deletes any extra rows beyond RequiredRows
```

## Use Cases

- **Data loading**: Set the correct number of rows when loading external data into a tabular group
- **Dynamic row management**: Adjust the number of rows based on a calculated value or user selection
- **Initialization**: Pre-populate a tabular section with a specific number of empty rows

## Related Functions

- [refreshtabularsection](./refreshtabularsection.md) - Forces a tabular section to re-render its display

## Notes

- Optional fourth parameter is a boolean that controls whether extra rows are deleted when reducing the row count
- The section and group hashes must match hashes defined in the form configuration
- Adding rows creates empty rows with default values

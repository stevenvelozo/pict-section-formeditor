# refreshtabularsection

Forces a tabular section to re-render its display.

## Syntax

```
refreshtabularsection(sectionHash, groupHash)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `sectionHash` | String | The hash identifier of the section containing the tabular group |
| `groupHash` | String | The hash identifier of the tabular group |

## Returns

Void. This function does not return a value.

## Description

The `refreshtabularsection` function forces a tabular form group to re-render its display. This is useful after programmatically modifying the underlying data of a tabular section, such as changing row counts, updating cell values, or restructuring the data. The re-render ensures that the displayed table reflects the current state of the data.

## Examples

### Refreshing after data modification

```expression
refreshtabularsection("DataSection", "DataGroup")
// Forces the DataGroup table in DataSection to re-render
```

### Refreshing after row count change

```expression
settabularrowlength("Orders", "LineItems", 5)
refreshtabularsection("Orders", "LineItems")
// Sets row count then refreshes the display
```

## Use Cases

- **Post-update refresh**: Re-render a table after programmatically modifying its data
- **Data synchronization**: Ensure the display matches the current application state after bulk changes
- **Layout correction**: Force a re-render to correct any display inconsistencies

## Related Functions

- [settabularrowlength](./settabularrowlength.md) - Sets the number of rows in a tabular data group

## Notes

- The section and group hashes must match hashes defined in the form configuration
- This function only affects the display; it does not modify the underlying data
- Typically called after other functions that modify tabular data programmatically

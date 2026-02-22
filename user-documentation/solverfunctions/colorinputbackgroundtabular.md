# colorinputbackgroundtabular

Sets the background color of a specific cell in a tabular group.

## Syntax

```
colorinputbackgroundtabular(sectionHash, groupHash, inputHash, rowIndex, color)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `sectionHash` | String | The hash identifier of the section containing the tabular group |
| `groupHash` | String | The hash identifier of the tabular group |
| `inputHash` | String | The hash identifier of the input (column) |
| `rowIndex` | Integer | The zero-based row index |
| `color` | String | HTML hex color string (e.g., `"#FFFFCC"`) |

## Returns

Void. This function does not return a value.

## Description

The `colorinputbackgroundtabular` function sets the background color of a specific cell within a tabular form group. It targets a single cell by its section, group, input (column), and row index. This enables cell-level visual formatting in tabular data, such as highlighting specific values, indicating validation errors in individual cells, or applying conditional formatting across a data grid. The function also accepts optional parameters for apply change behavior, CSS selector, and element ID prefix.

## Examples

### Highlighting a cell in the first row

```expression
colorinputbackgroundtabular("S1", "S1_G1", "Price", 0, "#FFFFCC")
// Sets the background of the Price cell in row 0 of group S1_G1 to light yellow
```

### Conditional cell coloring

```expression
CellColor = IF(RowTotal > Budget, "#FFE0E0", "#FFFFFF")
colorinputbackgroundtabular("DataSection", "DataGroup", "Total", RowIdx, CellColor)
// Red background if the row total exceeds budget, white otherwise
```

## Use Cases

- **Cell-level validation**: Highlight specific cells that contain invalid or out-of-range values
- **Conditional formatting**: Apply spreadsheet-like conditional formatting to tabular data
- **Data visualization**: Use color to represent data values in a tabular layout

## Related Functions

- [generatehtmlhexcolor](./generatehtmlhexcolor.md) - Generates an HTML hex color string from RGB components
- [colorinputbackground](./colorinputbackground.md) - Sets the background color of a non-tabular form input
- [colorgroupbackground](./colorgroupbackground.md) - Sets the background color of a form group

## Notes

- The `rowIndex` parameter is zero-based (first row is 0)
- Optional sixth parameter controls apply change behavior
- Optional seventh parameter specifies a CSS selector for targeting specific sub-elements
- Optional eighth parameter specifies an element ID prefix
- All hash parameters must match hashes defined in the form configuration

# colorinputbackground

Sets the background color of a form input.

## Syntax

```
colorinputbackground(sectionHash, inputHash, color)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `sectionHash` | String | The hash identifier of the section containing the input |
| `inputHash` | String | The hash identifier of the input |
| `color` | String | HTML hex color string (e.g., `"#FFFFCC"`) |

## Returns

Void. This function does not return a value.

## Description

The `colorinputbackground` function sets the background color of a specific form input element. This is the most granular color control available, targeting individual inputs within a form. It is useful for field-level validation feedback, highlighting specific fields that need attention, or providing visual cues based on calculated values. The function also accepts an optional fourth parameter to control apply change behavior and an optional fifth parameter for a CSS selector.

## Examples

### Highlighting a price field

```expression
colorinputbackground("S1", "Price", "#FFFFCC")
// Sets the background of the Price input in section S1 to light yellow
```

### Validation coloring

```expression
FieldColor = IF(Price > 0, "#FFFFFF", "#FFE0E0")
colorinputbackground("OrderDetails", "Price", FieldColor)
// White background if Price is valid, light red if not
```

## Use Cases

- **Field-level validation**: Highlight individual fields that have validation errors
- **Required field indication**: Color required fields to draw user attention
- **Value-based formatting**: Change input color based on its value (e.g., negative numbers in red)

## Related Functions

- [generatehtmlhexcolor](./generatehtmlhexcolor.md) - Generates an HTML hex color string from RGB components
- [colorsectionbackground](./colorsectionbackground.md) - Sets the background color of a form section
- [colorgroupbackground](./colorgroupbackground.md) - Sets the background color of a form group
- [colorinputbackgroundtabular](./colorinputbackgroundtabular.md) - Sets the background color of a cell in a tabular group

## Notes

- The color parameter should be a valid HTML hex color string including the `#` prefix
- Optional fourth parameter controls apply change behavior
- Optional fifth parameter specifies a CSS selector for targeting specific sub-elements
- The section and input hashes must match hashes defined in the form configuration

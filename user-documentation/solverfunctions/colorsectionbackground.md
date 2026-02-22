# colorsectionbackground

Sets the background color of a form section.

## Syntax

```
colorsectionbackground(sectionHash, color)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `sectionHash` | String | The hash identifier of the section |
| `color` | String | HTML hex color string (e.g., `"#FFE0E0"`) |

## Returns

Void. This function does not return a value.

## Description

The `colorsectionbackground` function sets the background color of a form section to the specified HTML hex color. This is useful for visually highlighting sections based on form state, validation results, or other conditions. The function can also accept an optional third parameter to control apply change behavior.

## Examples

### Highlighting a section with a light red background

```expression
colorsectionbackground("S1", "#FFE0E0")
// Sets the background of section S1 to light red
```

### Dynamic coloring based on status

```expression
SectionColor = IF(IsValid, "#E0FFE0", "#FFE0E0")
colorsectionbackground("FormData", SectionColor)
// Green background if valid, red background if not
```

## Use Cases

- **Validation feedback**: Color a section red when it contains validation errors, green when valid
- **Status indication**: Visually indicate the state of a section based on its completion or status
- **Attention drawing**: Highlight a section that requires user attention

## Related Functions

- [generatehtmlhexcolor](./generatehtmlhexcolor.md) - Generates an HTML hex color string from RGB components
- [colorgroupbackground](./colorgroupbackground.md) - Sets the background color of a form group
- [colorinputbackground](./colorinputbackground.md) - Sets the background color of a form input

## Notes

- The color parameter should be a valid HTML hex color string including the `#` prefix
- Can accept an optional third parameter for apply change behavior
- The section hash must match a hash defined in the form configuration

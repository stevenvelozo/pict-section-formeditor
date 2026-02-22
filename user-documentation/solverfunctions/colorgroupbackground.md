# colorgroupbackground

Sets the background color of a form group.

## Syntax

```
colorgroupbackground(sectionHash, groupHash, color)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `sectionHash` | String | The hash identifier of the section containing the group |
| `groupHash` | String | The hash identifier of the group |
| `color` | String | HTML hex color string (e.g., `"#E0FFE0"`) |

## Returns

Void. This function does not return a value.

## Description

The `colorgroupbackground` function sets the background color of a specific group within a form section. This provides more granular visual control than section-level coloring, allowing individual groups of inputs to be highlighted independently. It is useful for drawing attention to specific parts of a form or providing visual feedback at the group level.

## Examples

### Highlighting a group with a light green background

```expression
colorgroupbackground("S1", "S1_G1", "#E0FFE0")
// Sets the background of group S1_G1 in section S1 to light green
```

### Conditional group coloring

```expression
GroupColor = IF(GroupIsComplete, "#E0FFE0", "#FFFFFF")
colorgroupbackground("Details", "RequiredFields", GroupColor)
// Green background when all required fields are filled, white otherwise
```

## Use Cases

- **Group-level validation**: Color a group based on whether its inputs pass validation
- **Visual grouping**: Use color to distinguish between different groups within a section
- **Completion tracking**: Indicate which groups of fields have been completed

## Related Functions

- [generatehtmlhexcolor](./generatehtmlhexcolor.md) - Generates an HTML hex color string from RGB components
- [colorsectionbackground](./colorsectionbackground.md) - Sets the background color of a form section
- [colorinputbackground](./colorinputbackground.md) - Sets the background color of a form input

## Notes

- The color parameter should be a valid HTML hex color string including the `#` prefix
- Both the section hash and group hash must match hashes defined in the form configuration
- The parent section must be visible for the group color change to be seen

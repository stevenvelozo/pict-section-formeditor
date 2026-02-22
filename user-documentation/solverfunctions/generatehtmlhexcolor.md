# generatehtmlhexcolor

Generates an HTML hex color string from RGB components.

## Syntax

```
generatehtmlhexcolor(red, green, blue)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `red` | Integer | Red component, 0-255 |
| `green` | Integer | Green component, 0-255 |
| `blue` | Integer | Blue component, 0-255 |

## Returns

A string containing the HTML hex color code (e.g., `"#FF0000"`).

## Description

The `generatehtmlhexcolor` function takes three integer values representing the red, green, and blue components of a color and returns the corresponding HTML hex color string. Each component should be an integer between 0 and 255. The returned string is in the format `#RRGGBB` and can be used with color-related form functions such as `colorsectionbackground`, `colorgroupbackground`, and `colorinputbackground`.

## Examples

### Generating an orange color

```expression
Color = generatehtmlhexcolor(255, 128, 0)
// Color is "#FF8000"
```

### Generating red

```expression
Red = generatehtmlhexcolor(255, 0, 0)
// Red is "#FF0000"
```

### Using calculated color values

```expression
Intensity = Score * 255 / 100
BarColor = generatehtmlhexcolor(Intensity, 255 - Intensity, 0)
// Produces a color ranging from green (low score) to red (high score)
```

## Use Cases

- **Dynamic coloring**: Generate colors based on calculated values for use in form styling
- **Data visualization**: Map numeric values to colors for visual feedback in forms
- **Conditional formatting**: Create color values dynamically based on form state

## Related Functions

- [colorsectionbackground](./colorsectionbackground.md) - Sets the background color of a form section
- [colorgroupbackground](./colorgroupbackground.md) - Sets the background color of a form group
- [colorinputbackground](./colorinputbackground.md) - Sets the background color of a form input

## Notes

- Each RGB component should be an integer between 0 and 255
- Values outside the 0-255 range may produce unexpected results
- The returned string includes the `#` prefix

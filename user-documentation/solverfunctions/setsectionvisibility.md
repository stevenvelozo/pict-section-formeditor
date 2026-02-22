# setsectionvisibility

Sets a specific section's visibility.

## Syntax

```
setsectionvisibility(sectionHash, visible)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `sectionHash` | String | The hash identifier of the section |
| `visible` | Boolean or String | `true`/`false` or `"1"`/`"0"` to set visibility |

## Returns

Void. This function does not return a value.

## Description

The `setsectionvisibility` function sets the visibility of a single form section based on a boolean or string value. Unlike `showsections` and `hidesections` which operate on lists, this function targets one section and accepts a dynamic visibility value. This makes it ideal for binding section visibility directly to a calculated or user-driven boolean expression.

## Examples

### Toggling visibility based on a flag

```expression
setsectionvisibility("AdvancedOptions", ShowAdvanced)
// If ShowAdvanced is true, the AdvancedOptions section is shown
// If ShowAdvanced is false, the AdvancedOptions section is hidden
```

### Using a string value

```expression
setsectionvisibility("ExtraFields", "1")
// Shows the ExtraFields section
```

## Use Cases

- **Dynamic visibility**: Bind a section's visibility to a checkbox or toggle input
- **Calculated visibility**: Show or hide a section based on the result of a solver expression
- **Conditional display**: Control section visibility using any boolean-producing expression

## Related Functions

- [showsections](./showsections.md) - Makes the specified form sections visible
- [hidesections](./hidesections.md) - Hides the specified form sections
- [setgroupvisibility](./setgroupvisibility.md) - Sets a specific group's visibility within a section

## Notes

- The `visible` parameter accepts boolean values (`true`/`false`) or string equivalents (`"1"`/`"0"`)
- The section hash must match a hash defined in the form configuration
- The section retains its data in the application state regardless of visibility

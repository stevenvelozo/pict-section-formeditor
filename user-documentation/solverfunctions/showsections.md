# showsections

Makes the specified form sections visible.

## Syntax

```
showsections(sectionHashes)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `sectionHashes` | Array or String | An array of section hash strings, or a single section hash string |

## Returns

Void. This function does not return a value.

## Description

The `showsections` function makes one or more form sections visible on the page. You can pass either an array of section hash strings to show multiple sections at once, or a single string to show one section. This is commonly used in conjunction with solver logic to conditionally display parts of a form based on user input or other state.

## Examples

### Showing multiple sections from an array

```expression
showsections(VisibleSectionList)
// Where VisibleSectionList is an array like ["S1", "S3"]
// Makes sections S1 and S3 visible
```

### Showing a single section

```expression
showsections("AdvancedOptions")
// Makes the AdvancedOptions section visible
```

## Use Cases

- **Conditional form display**: Show sections of a form based on user selections or calculated state
- **Progressive disclosure**: Reveal additional form sections as the user completes earlier sections
- **Role-based visibility**: Show different sections depending on user role or permissions

## Related Functions

- [hidesections](./hidesections.md) - Hides the specified form sections
- [setsectionvisibility](./setsectionvisibility.md) - Sets a specific section's visibility with a boolean
- [setgroupvisibility](./setgroupvisibility.md) - Sets a specific group's visibility within a section

## Notes

- Accepts either an array of section hash strings or a single string
- Section hashes must match the hashes defined in the form configuration
- Does not affect the visibility of groups within the sections

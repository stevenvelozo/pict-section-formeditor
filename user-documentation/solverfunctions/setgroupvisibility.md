# setgroupvisibility

Sets a specific group's visibility within a section.

## Syntax

```
setgroupvisibility(sectionHash, groupHash, visible)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `sectionHash` | String | The hash identifier of the section containing the group |
| `groupHash` | String | The hash identifier of the group |
| `visible` | Boolean | `true` to show the group, `false` to hide it |

## Returns

Void. This function does not return a value.

## Description

The `setgroupvisibility` function controls the visibility of a specific group within a form section. Groups are subdivisions within sections that contain one or more form inputs. This function allows fine-grained control over which groups of inputs are visible, enabling more detailed conditional display logic than section-level visibility alone.

## Examples

### Toggling a group based on a condition

```expression
setgroupvisibility("S1", "S1_G2", ShowDetails)
// If ShowDetails is true, group S1_G2 within section S1 is shown
// If ShowDetails is false, group S1_G2 within section S1 is hidden
```

### Hiding a group

```expression
setgroupvisibility("ContactInfo", "AlternateAddress", false)
// Hides the AlternateAddress group within the ContactInfo section
```

## Use Cases

- **Fine-grained visibility**: Show or hide individual groups of inputs within a section
- **Conditional fields**: Display additional input groups based on user selections
- **Progressive disclosure**: Reveal groups of related fields as the user provides information

## Related Functions

- [setsectionvisibility](./setsectionvisibility.md) - Sets a specific section's visibility
- [showsections](./showsections.md) - Makes the specified form sections visible
- [hidesections](./hidesections.md) - Hides the specified form sections

## Notes

- Both the section hash and group hash must match hashes defined in the form configuration
- The group retains its data in the application state regardless of visibility
- The parent section must be visible for group visibility changes to have a visual effect

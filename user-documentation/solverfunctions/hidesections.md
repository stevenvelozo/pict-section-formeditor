# hidesections

Hides the specified form sections.

## Syntax

```
hidesections(sectionHashes)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `sectionHashes` | Array or String | An array of section hash strings, or a single section hash string |

## Returns

Void. This function does not return a value.

## Description

The `hidesections` function hides one or more form sections from the page. You can pass either an array of section hash strings to hide multiple sections at once, or a single string to hide one section. Hidden sections are not visible to the user but remain part of the form state. This is commonly used in conjunction with solver logic to conditionally hide parts of a form based on user input or other state.

## Examples

### Hiding multiple sections from an array

```expression
hidesections(HiddenSectionList)
// Where HiddenSectionList is an array like ["S2", "S4"]
// Hides sections S2 and S4
```

### Hiding a single section

```expression
hidesections("OptionalDetails")
// Hides the OptionalDetails section
```

## Use Cases

- **Conditional form display**: Hide sections of a form that are not relevant based on user selections
- **Simplifying forms**: Remove unnecessary sections to reduce visual clutter
- **Workflow gating**: Hide sections until prerequisite conditions are met

## Related Functions

- [showsections](./showsections.md) - Makes the specified form sections visible
- [setsectionvisibility](./setsectionvisibility.md) - Sets a specific section's visibility with a boolean
- [setgroupvisibility](./setgroupvisibility.md) - Sets a specific group's visibility within a section

## Notes

- Accepts either an array of section hash strings or a single string
- Section hashes must match the hashes defined in the form configuration
- Hidden sections retain their data in the application state

# enablesolverordinal

Enables all solvers with the specified ordinal number so they will execute.

## Syntax

```
enablesolverordinal(ordinal)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `ordinal` | Integer | The ordinal number of the solver group to enable |

## Returns

Void. This function does not return a value.

## Description

The `enablesolverordinal` function enables all solvers assigned to a specific ordinal number, ensuring they will execute during subsequent solver runs. This is a convenience function equivalent to calling `setsolverordinalenabled(ordinal, true)`. It is typically used to re-enable a group of solvers that was previously disabled.

## Examples

### Enabling ordinal 3 solvers

```expression
enablesolverordinal(3)
// All solvers with ordinal 3 will now execute during solver runs
```

### Re-enabling solvers after a condition is met

```expression
enablesolverordinal(2)
// Re-enables ordinal 2 solvers that were previously disabled
```

## Use Cases

- **Re-enabling solvers**: Turn on a group of solvers that was previously disabled
- **Workflow progression**: Enable additional solver groups as the user progresses through a form
- **Conditional activation**: Enable solver groups when specific conditions are met

## Related Functions

- [setsolverordinalenabled](./setsolverordinalenabled.md) - Enables or disables solvers with a boolean
- [disablesolverordinal](./disablesolverordinal.md) - Disables all solvers with the specified ordinal
- [runsolvers](./runsolvers.md) - Triggers re-execution of all solver expressions

## Notes

- Equivalent to `setsolverordinalenabled(ordinal, true)`
- The ordinal number must correspond to an ordinal defined in the solver configuration
- Changes take effect on the next solver run

# disablesolverordinal

Disables all solvers with the specified ordinal number so they will not execute.

## Syntax

```
disablesolverordinal(ordinal)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `ordinal` | Integer | The ordinal number of the solver group to disable |

## Returns

Void. This function does not return a value.

## Description

The `disablesolverordinal` function disables all solvers assigned to a specific ordinal number, preventing them from executing during subsequent solver runs. This is a convenience function equivalent to calling `setsolverordinalenabled(ordinal, false)`. Disabled solvers are skipped entirely, which can improve performance and prevent unwanted calculations.

## Examples

### Disabling ordinal 3 solvers

```expression
disablesolverordinal(3)
// All solvers with ordinal 3 will now be skipped during solver runs
```

### Disabling advanced calculations

```expression
disablesolverordinal(5)
// Prevents ordinal 5 solvers from running
```

## Use Cases

- **Skipping irrelevant calculations**: Disable solver groups that are not needed for the current form state
- **Performance optimization**: Prevent unnecessary solver execution to improve responsiveness
- **Mode switching**: Disable solver groups when switching between form modes

## Related Functions

- [setsolverordinalenabled](./setsolverordinalenabled.md) - Enables or disables solvers with a boolean
- [enablesolverordinal](./enablesolverordinal.md) - Enables all solvers with the specified ordinal
- [runsolvers](./runsolvers.md) - Triggers re-execution of all solver expressions

## Notes

- Equivalent to `setsolverordinalenabled(ordinal, false)`
- The ordinal number must correspond to an ordinal defined in the solver configuration
- Disabled solvers retain their configuration and can be re-enabled at any time
- Changes take effect on the next solver run

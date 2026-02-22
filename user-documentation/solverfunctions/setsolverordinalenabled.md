# setsolverordinalenabled

Enables or disables all solvers with the specified ordinal number.

## Syntax

```
setsolverordinalenabled(ordinal, enabled)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `ordinal` | Integer | The ordinal number of the solver group to enable or disable |
| `enabled` | Boolean | `true` to enable the solvers, `false` to disable them |

## Returns

Void. This function does not return a value.

## Description

The `setsolverordinalenabled` function controls whether all solvers assigned to a specific ordinal number are executed during solver runs. Solvers are organized by ordinal numbers that determine their execution order. By disabling an ordinal, all solvers at that ordinal are skipped during execution. This enables conditional execution of entire groups of solver expressions based on form state, user input, or other conditions.

## Examples

### Toggling solvers based on a mode flag

```expression
setsolverordinalenabled(2, IsAdvancedMode)
// If IsAdvancedMode is true, ordinal 2 solvers run; otherwise they are skipped
```

### Disabling a solver group

```expression
setsolverordinalenabled(5, false)
// Disables all solvers with ordinal 5
```

## Use Cases

- **Conditional solver execution**: Enable or disable groups of solvers based on form state
- **Performance optimization**: Skip unnecessary solver calculations when they are not relevant
- **Mode switching**: Enable different sets of solvers for different form modes (e.g., basic vs. advanced)

## Related Functions

- [enablesolverordinal](./enablesolverordinal.md) - Enables all solvers with the specified ordinal
- [disablesolverordinal](./disablesolverordinal.md) - Disables all solvers with the specified ordinal
- [runsolvers](./runsolvers.md) - Triggers re-execution of all solver expressions

## Notes

- Disabled ordinals skip execution entirely during solver runs
- Used for conditional execution of entire groups of solvers
- The ordinal number must correspond to an ordinal defined in the solver configuration
- Changes take effect on the next solver run

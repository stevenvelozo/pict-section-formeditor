# runsolvers

Triggers a re-execution of all solver expressions across all form views.

## Syntax

```
runsolvers()
```

## Parameters

This function takes no parameters.

## Returns

Void. This function does not return a value.

## Description

The `runsolvers` function triggers a complete re-execution of all active solver expressions across all form views. This forces a full recalculation pass, which can be necessary after programmatic changes to form state that would not otherwise trigger solver execution. Use this function with caution, as calling it from within a solver can create infinite loops if not properly controlled with ordinal gating.

## Examples

### Triggering a solver re-run

```expression
runsolvers()
// Triggers re-execution of all active solver expressions
```

## Use Cases

- **Forcing recalculation**: Trigger a full solver pass after programmatically modifying application state
- **Synchronization**: Ensure all calculated values are up to date after bulk data changes
- **Chain reactions**: Propagate changes that require multiple solver passes to fully resolve

## Related Functions

- [setsolverordinalenabled](./setsolverordinalenabled.md) - Enables or disables solvers with a specific ordinal
- [enablesolverordinal](./enablesolverordinal.md) - Enables all solvers with the specified ordinal
- [disablesolverordinal](./disablesolverordinal.md) - Disables all solvers with the specified ordinal

## Notes

- Use with caution: calling `runsolvers()` from within a solver expression can create infinite loops
- Protect against infinite loops by using ordinal gating (disable the calling ordinal before invoking `runsolvers`)
- All active (enabled) solver ordinals will execute in order
- Disabled ordinals are skipped during the re-execution

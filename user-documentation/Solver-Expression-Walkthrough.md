# Solver Expression Walkthrough

This guide walks through the basics of writing solver expressions step by step. By the end, you will understand how to create computed values, reference form inputs, and use functions.

## What is a Solver Expression?

A solver expression is a formula that the form engine evaluates at runtime. It can compute values, look up data, compare conditions, and assign results to form fields. Expressions are attached to sections (or to Tabular/RecordSet groups) and run automatically when the form renders or when data changes.

## Your First Expression

The simplest expression assigns a constant value:

```
DefaultRate = 0.05
```

This creates a variable called `DefaultRate` with the value `0.05`. The left side of the `=` is the assignment target and the right side is the value.

## Referencing Inputs

Solver expressions can reference any input in the form by its hash. If your form has inputs with hashes `Price` and `Quantity`, you can compute a total:

```
Total = Price * Quantity
```

When the form renders, the solver reads the current values of `Price` and `Quantity`, multiplies them, and writes the result to `Total`. If `Total` is also an input in the form, it will display the computed value.

## Arithmetic Operators

Expressions support standard arithmetic with the following operators, listed from highest to lowest precedence:

| Operator | Description | Example |
|----------|-------------|---------|
| `^` | Exponentiation | `2 ^ 3` gives `8` |
| `*` | Multiplication | `5 * 3` gives `15` |
| `/` | Division | `15 / 3` gives `5` |
| `%` | Modulus | `7 % 3` gives `1` |
| `+` | Addition | `5 + 3` gives `8` |
| `-` | Subtraction | `5 - 3` gives `2` |

Parentheses override precedence:

```
Result = (Price + Tax) * Quantity
```

## Using Functions

Functions are called by name with arguments in parentheses. For example, to round a result to two decimal places:

```
RoundedTotal = round(Price * Quantity, 2)
```

Functions are case-insensitive. `ROUND`, `Round`, and `round` all work the same way.

See [Solver Functions](Solver-Functions.md) for the complete list of available functions.

## String Values

Use double quotes for string literals:

```
Status = if(Total, ">", 1000, "High Value", "Standard")
```

String values can contain special characters. Use `&comma;` for commas inside function arguments (since commas normally separate arguments):

```
Label = join("&comma; ", FirstName, LastName)
```

The `resolvehtmlentities` function can convert HTML entities to their actual characters when needed.

## Conditional Logic

### The if Function

The `if` function compares two values and returns one of two results:

```
if(left, operator, right, trueValue, falseValue)
```

Operators include `<`, `>`, `<=`, `>=`, `==` (loose equality), and `===` (strict equality). You can also use `LT`, `GT`, `LTE`, `GTE` as aliases.

```
Discount = if(Total, ">=", 100, Total * 0.1, 0)
```

Nested conditions handle multiple outcomes:

```
Grade = if(Score, ">=", 90, "A", if(Score, ">=", 80, "B", if(Score, ">=", 70, "C", "F")))
```

### The when Function

The `when` function is a simpler check for whether a value is truthy (exists and is not empty):

```
DisplayName = when(Nickname, Nickname, FullName)
```

If `Nickname` has a value, use it; otherwise fall back to `FullName`.

## Reading Application State

Use `getvalue` to access data from anywhere in the application state:

```
TaxRate = getvalue("AppData.Settings.TaxRate")
```

The path must be a quoted string. Array elements use bracket notation:

```
FirstItem = getvalue("AppData.Cart.Items[0].Name")
```

## Aggregate Functions

When working with arrays of data, aggregate functions compute summaries:

```
TotalCost = sum(ItemPrices)
AverageCost = mean(ItemPrices)
ItemCount = count(ItemPrices)
HighestPrice = max(ItemPrices)
LowestPrice = min(ItemPrices)
```

These work on arrays. You can use `flatten` to gather values from nested data structures:

```
AllPopulations = flatten(getvalue("AppData.Cities[].population"))
TotalPopulation = sum(AllPopulations)
```

## Null Coalescence Assignment

Use `?=` instead of `=` to only assign a value if the target is currently empty or undefined:

```
DefaultName ?= "Unnamed"
```

This sets `DefaultName` to `"Unnamed"` only if it does not already have a value. This is useful for setting initial defaults without overwriting user input.

## Putting It All Together

Here is a realistic example that computes a shopping cart summary:

```
Subtotal = sum(flatten(getvalue("AppData.Cart.Items[].Price")))
TaxRate = getvalue("AppData.Settings.TaxRate")
Tax = round(Subtotal * TaxRate, 2)
Total = Subtotal + Tax
DiscountApplied = if(Total, ">=", 100, "Yes", "No")
FinalTotal = if(DiscountApplied, "==", "Yes", round(Total * 0.9, 2), Total)
```

Each expression references the results of previous ones. The ordinal system (all default to 1 here) ensures they execute in order.

## Execution Order and Ordinals

Solvers execute in ordinal order. All solvers with ordinal 1 run first, then ordinal 2, and so on. Within the same ordinal, solvers execute in the order they appear in the manifest.

Most solvers use the default ordinal of 1. When you need a solver to run after others have completed, give it a higher ordinal (2, 3, etc.). This is useful when one group of calculations depends on the results of another.

## Next Steps

- Read [Solver Expressions Advanced Topics](Solver-Expressions-Advanced.md) for scope rules, set operations, and tabular solvers
- Browse the [Solver Functions](Solver-Functions.md) reference for the complete function list
- Return to the [Table of Contents](ToC.md)

# Solvers

Solvers are expressions that compute values, transform data, or control form behavior. They run when the form renders and can assign calculated results to input fields.

## What is a Solver Expression?

A solver expression is a string written in the Fable expression syntax. It can reference input addresses, perform arithmetic, call built-in functions, and assign results to data paths. Solvers are attached to sections or to tabular/recordset groups.

## Where Solvers Live

- **Section Solvers** -- Attached to a section and evaluated in the context of that section's data. Most solvers are section-level.
- **Group Solvers (RecordSet)** -- Attached to a Tabular or RecordSet group and evaluated for each record in the set. Only groups with a Tabular or RecordSet layout can have their own solvers.

## The Solver Editor Tab

The **Solver Editor** tab provides a focused environment for writing and editing solver expressions. It has three areas:

### Code Editor

The main editing area uses a syntax-highlighted code editor. Write your solver expression here. The editor supports the Fable expression language with highlighting for operators, addresses, and functions.

### Ordinal

Each solver has an ordinal number that controls its execution order. Solvers with lower ordinals run first. The default ordinal is 1. If you need a solver to run before or after others, adjust its ordinal value.

- When a solver has the default ordinal (1), it is stored as a simple string in the manifest.
- When you set a non-default ordinal, the solver is promoted to an object with `Expression` and `Ordinal` properties.
- Clearing the ordinal (or setting it back to 1) demotes the solver back to a simple string.

### Reference List

A searchable list of all inputs in the form, organized by section. Each entry shows:

- The input name and hash
- The data address
- An **Insert** button that pastes the address into the code editor at the cursor

Use the search box to filter inputs by name, hash, address, or section.

## The Solvers Tab

The **Solvers** tab provides a read-only overview of all solver expressions across the form. It is organized into sections:

### Solver Health

At the top, a health summary shows any potential issues:

- **Expressions with no hash** -- Solver expressions that do not assign a value to any input. These may be intentional (side-effect expressions) or may indicate a missing assignment.
- **Unresolved references** -- Addresses referenced in solver expressions that do not match any input in the form. These may indicate typos or deleted inputs.

### Solver List

Below the health section, all solvers are listed grouped by their parent section or group. Each solver expression is clickable and opens directly in the Solver Editor.

### Input Solver Info

When you select an input in the visual editor, the Input tab in the properties panel shows solver information for that input:

- **Assigned by** -- Which solver expression assigns a value to this input (if any). Clickable to open in the Solver Editor.
- **Referenced by** -- All solver expressions that read this input's value. Each is clickable.

## Adding a Solver

There are two ways to add a solver:

1. **From the properties panel** -- In the Section tab, use the solvers list to add a new solver to the selected section.
2. **From the Add Solver helper** -- At the bottom of both the Solvers tab and the Solver Editor tab, a dropdown lets you select a target section or group, then click **+ Add Solver** to create a new empty solver and open it in the editor.

## Managing Solvers

- **Edit** -- Click any solver expression in the Solvers tab or properties panel to open it in the Solver Editor.
- **Reorder** -- Use the up/down arrow buttons next to each solver in the properties panel. When drag-and-drop is enabled, solvers can be dragged to reorder.
- **Delete** -- Click the delete button next to a solver in the properties panel.

## Next Steps

- Read the [Solver Expression Walkthrough](Solver-Expression-Walkthrough.md) for a step-by-step introduction to writing expressions
- Explore [Solver Expressions Advanced Topics](Solver-Expressions-Advanced.md) for scope rules, set operations, and MAP/SERIES
- Browse the [Solver Functions](Solver-Functions.md) reference for every available function
- Learn about [Inputs & Data Types](Inputs.md) to understand what solvers reference
- Return to the [Table of Contents](ToC.md)

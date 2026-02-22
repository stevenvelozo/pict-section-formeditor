# Sections

Sections are the top-level building blocks of a form. Every form has at least one section, and each section contains one or more groups of inputs.

## Creating a Section

Click the **Add Section** button in the visual editor toolbar. A new section is created with an auto-generated name and hash (e.g. "Section 2" with hash "S2"). The new section includes one empty group by default.

## Section Properties

Select a section by clicking its header in the visual editor or choosing it from the Section tab in the properties panel. The following properties are available:

- **Name** -- The display label for the section (e.g. "Personal Information"). Click the name in the visual editor to edit it inline.
- **Hash** -- A unique identifier used in the manifest data structure (e.g. "S1", "PersonalInfo"). Click the hash in the visual editor to edit it inline.
- **Description** -- A multi-line description of the section's purpose.
- **CSSClass** -- A CSS class name applied to the section container for custom styling.
- **CustomCSS** -- Raw CSS rules scoped to the section (e.g. `h3 { color: red; }`).

## Reordering Sections

Sections can be moved up or down using the arrow buttons on the section header in the visual editor. When drag-and-drop is enabled, you can also drag sections to reorder them.

## Deleting a Section

Click the delete button on the section header. This removes the section and all of its groups, rows, and inputs.

## Section Solvers

Each section can have solver expressions attached to it. These are evaluated when the form renders and can compute values, show/hide elements, or set defaults. Solvers are managed from the section properties in the properties panel, where you can add, edit, reorder, and remove them.

See [Solvers](Solvers.md) for details on how solver expressions work.

## Next Steps

- Learn about [Groups](Groups.md) to organize inputs within sections
- Return to the [Table of Contents](ToC.md)

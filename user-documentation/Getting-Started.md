# Getting Started

The Form Editor is a visual tool for building and editing pict-section-form configuration manifests. A manifest describes the structure of a form: its sections, groups, inputs, data types, and solver expressions.

## The Editor Layout

The editor is divided into two main areas:

- **Visual Editor** (left) -- The main canvas where you build your form by adding sections, groups, and inputs. You can click on any element to select it and edit its properties.
- **Properties Panel** (right) -- A collapsible panel with tabs for editing the selected element. Switch between Form, Section, Group, Input, Options, and Help tabs.

## Building a Form

1. **Add a Section** -- Click the "Add Section" button in the visual editor toolbar. Every form needs at least one section.
2. **Add a Group** -- Within a section, click "Add Group" to create an input group. Groups organize related inputs together.
3. **Add Inputs** -- Inside a group, click "Add Input" to create form fields. Each input has a name, data type, and input type.
4. **Configure Properties** -- Click on any section, group, or input to select it. Its properties will appear in the Properties Panel on the right.

## Tabs

The main editor has several tabs across the top:

- **Visual** -- The drag-and-drop form builder
- **Solver Editor** -- Edit solver expressions for computed fields
- **Solvers** -- View all solver expressions at a glance
- **JSON** -- View and edit the raw manifest JSON

## Next Steps

- Learn about [Sections](Sections.md) to understand form structure
- Explore [Solvers](Solvers.md) to add computed values
- Return to the [Table of Contents](ToC.md) for all topics

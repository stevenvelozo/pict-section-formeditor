# Groups

Groups organize related inputs within a section. Each section contains one or more groups, and each group contains rows of inputs.

## Creating a Group

Click the **Add Group** button inside a section in the visual editor. A new group is created with an auto-generated hash based on the section (e.g. "S1_G2") and a default Record layout.

## Group Properties

Select a group by clicking its icon in the visual editor or choosing it from the Group tab's searchable dropdown in the properties panel. The following properties are available:

- **Name** -- The display label for the group (e.g. "Contact Details"). Click the name in the visual editor to edit it inline.
- **Hash** -- A unique identifier (e.g. "S1_G1"). Click the hash in the visual editor to edit it inline.
- **Layout** -- The group's layout strategy. Click the layout label in the visual editor to change it via a dropdown, or use the Group tab in the properties panel.
- **CSSClass** -- A CSS class name for styling the group container.

## Layout Types

Groups support three layout modes:

### Record

The default layout. Each row in the group displays a single record's worth of inputs side by side. This is the standard layout for most forms.

### Tabular

A multi-column grid layout for displaying data in a table format. Tabular groups have additional properties:

- **RecordSetAddress** -- The AppData path to the data array (e.g. `FruitData.FruityVice`).
- **RecordManifest** -- A reference to an external manifest that defines the columns.
- **RecordSetSolvers** -- Solver expressions that apply to each record in the set.

The properties panel shows a summary of the referenced manifest, including column count and data types.

### RecordSet

A multi-row layout for displaying and editing sets of records. Similar to Tabular, it uses a sub-manifest to define the structure of each record. RecordSet groups share the same additional properties as Tabular groups.

## Reordering Groups

Use the arrow buttons on the group header in the visual editor to move groups up or down within their section. When drag-and-drop is enabled, groups can be dragged within a section or across sections.

## Deleting a Group

Click the delete button on the group header. This removes the group, its rows, and all contained inputs.

## Next Steps

- Learn about [Inputs & Data Types](Inputs.md) to add fields to your groups
- Return to [Sections](Sections.md) for the broader form structure
- Return to the [Table of Contents](ToC.md)

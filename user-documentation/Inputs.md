# Inputs & Data Types

Inputs are the individual form fields that users interact with. Each input has a data type that defines what kind of value it stores and an input type that controls how it is rendered.

## Creating an Input

Click the **Add Input** button inside a row in the visual editor. A new input is created with a default String data type and no input type. You can also add rows to a group using the **Add Row** button, which creates a new horizontal row that can hold multiple inputs side by side.

## Input Properties

Select an input by clicking it in the visual editor. Its properties appear in the Input tab of the properties panel:

- **Name** -- The display label shown to the user (e.g. "Email Address").
- **Hash** -- A unique identifier for this input within the manifest.
- **Address** -- The data path that binds this input to a value in AppData (e.g. `UserProfile.Email`). Changing the address re-keys the input in the manifest. A confirmation step prevents accidental changes.
- **DataType** -- The underlying data type for this field (see Data Types below).
- **InputType** -- The rendering and interaction style (see Input Types below). Click the InputType button to open a searchable picker.
- **Width** -- Grid width from 1 to 12 columns for responsive layout.

## Data Types

Each input stores a value with one of the following data types:

- **String** -- Text values (the default)
- **Number** -- Numeric values
- **Float** -- Floating-point numbers
- **Integer** -- Whole numbers
- **PreciseNumber** -- High-precision decimal values
- **Boolean** -- True or false
- **Binary** -- Binary data
- **DateTime** -- Date and time values
- **Array** -- Ordered lists of values
- **Object** -- Key-value data structures
- **Null** -- Null/empty value

Change the data type from the Input tab dropdown or by clicking the data type label directly in the visual editor.

## Input Types

Input types control how a field is rendered and how the user interacts with it. They are organized into categories:

### Text & Content

- **TextArea** -- Multi-line text input
- **Markdown** -- Markdown-formatted text editor
- **HTML** -- Rich HTML content block

### Selection

- **Option** -- Dropdown select from a set of choices. Has additional properties:
  - *Select Options* -- A JSON array of `{id, text}` option objects
  - *Pick List Name* -- A named dynamic pick list from AppData
- **Boolean** -- Checkbox or toggle for true/false values
- **Color** -- Color picker input

### Display

- **Display Only** -- Read-only display of the value with no input control
- **Read Only** -- Input-styled read-only field
- **Precise Number (Read Only)** -- Formatted number display with additional properties:
  - *Decimal Precision* -- Number of decimal places
  - *Add Commas* -- Thousand-separator formatting
  - *Prefix* -- String prepended to the value (e.g. "$")
  - *Postfix* -- String appended to the value (e.g. " USD")
- **Hidden** -- Hidden input, not visible to the user
- **Chart** -- Data visualization with additional properties:
  - *Chart Type* -- The chart style (bar, line, pie, doughnut, radar, polarArea)
  - *Labels Address* -- AppData path for chart labels
  - *Labels Solver* -- Solver expression for chart labels
  - *Datasets Address* -- AppData path for chart datasets
- **Link** -- Clickable hyperlink display

### Navigation

- **Tab Section Selector** -- Controls which sections display as tabs. Properties:
  - *Section Set* -- JSON array of section hashes to show as tabs
  - *Default Tab* -- Hash of the initially selected tab
  - *Default From Data* -- Use the data value to pick the default
- **Tab Group Selector** -- Controls which groups display as tabs. Same properties as above but for groups.

### Advanced

- **Templated** -- Custom template-driven rendering. The *Template* property holds the template string.
- **Templated Entity Lookup** -- Template-driven entity search and selection with a *Template* property.

When an InputType has additional properties, they appear in a dedicated section of the Input tab after the standard fields.

## Reordering and Moving Inputs

- Use the left and right arrow buttons in the properties panel to move an input within its row.
- Rows can be moved up or down using arrow buttons on the row header.
- When drag-and-drop is enabled, inputs can be dragged within rows or across rows, and rows can be dragged within groups or across groups.

## Next Steps

- Learn about [Solvers](Solvers.md) to add computed values
- Manage option lists for selection inputs in the Options tab (see [Getting Started](Getting-Started.md))
- Return to the [Table of Contents](ToC.md)

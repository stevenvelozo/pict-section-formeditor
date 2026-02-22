# pict-section-formeditor

A visual editor for [pict-section-form](https://github.com/stevenvelozo/pict-section-form) configuration manifests. Build, edit, and preview form layouts in the browser with a drag-and-drop interface, inline property editing, solver expression authoring, and live form preview.

## Features

- **Visual Editor** -- Drag-and-drop sections, groups, rows, and inputs in a structured layout
- **JSON Editor** -- Edit the raw manifest JSON with syntax highlighting via CodeJar
- **Properties Panel** -- Inline editing of section, group, row, and input properties
- **Solver Editor** -- Author solver expressions with a built-in expression linter and token inspector
- **Live Preview** -- Render the form as it will appear to end users using a child pict instance
- **Embedded Help** -- Context-sensitive documentation for all 127+ solver functions, input types, and editor features
- **Input Type Picker** -- Browse all available pict-section-form input types organized by category
- **Display Modes** -- Toggle between human-readable names and manifest hash identifiers

## Installation

```bash
npm install pict-section-formeditor
```

## Quick Start

Add the form editor view to any pict application:

```javascript
const libPict = require('pict');
const libPictApplication = require('pict-application');
const libPictSectionFormEditor = require('pict-section-formeditor');

class MyApp extends libPictApplication
{
    onAfterInitializeAsync(fCallback)
    {
        // Provide a manifest object at a known AppData address
        this.pict.AppData.FormConfig =
        {
            Scope: 'MyForm',
            Sections: [],
            Descriptors: {}
        };

        // Add the form editor view
        this.pict.addView('FormEditor',
        {
            ViewIdentifier: 'FormEditor',
            ManifestDataAddress: 'AppData.FormConfig',
            DefaultDestinationAddress: '#FormEditor-Container',
            ActiveTab: 'visual'
        }, libPictSectionFormEditor);

        // Initialize and render
        this.pict.views.FormEditor.initialize();
        this.pict.views.FormEditor.render();

        return super.onAfterInitializeAsync(fCallback);
    }
}
```

In your HTML, provide a container element and the Pict CSS style block:

```html
<style id="PICT-CSS"></style>
<div id="FormEditor-Container"></div>
```

## Configuration Options

| Option | Type | Default | Description |
|---|---|---|---|
| `ManifestDataAddress` | String | `'FormEditor.Manifest'` | AppData address where the manifest object lives |
| `DefaultDestinationAddress` | String | -- | CSS selector for the editor container element |
| `ActiveTab` | String | `'visual'` | Initial tab: `'visual'`, `'json'`, or `'preview'` |

## Manifest Format

The editor works with standard pict-section-form manifests:

```json
{
    "Scope": "MyForm",
    "Sections": [
        {
            "Hash": "Details",
            "Name": "Contact Details"
        }
    ],
    "Descriptors": {
        "Name": {
            "Name": "Full Name",
            "Hash": "Name",
            "DataType": "String",
            "PictForm": { "Section": "Details", "Row": 1, "Width": 1 }
        }
    }
}
```

## Running the Example Application

```bash
cd example_applications/form_editor
npm install
npx quack build
# Open html/index.html in a browser
```

## Building

```bash
npm test         # Run tests
npx quack build  # Bundle the library
```

## License

MIT

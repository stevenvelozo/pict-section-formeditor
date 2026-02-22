# pict-section-formeditor

A visual editor for pict-section-form configuration manifests.

The form editor lets you build and modify pict-section-form manifests through a browser-based interface. Sections, groups, rows, and inputs can be created, rearranged, and configured without hand-editing JSON.

## Getting Started

### Install

```bash
npm install pict-section-formeditor
```

### Add the Editor to Your Application

The form editor is a pict view. Register it with your pict application and point it at a manifest object in `AppData`:

```javascript
const libPictSectionFormEditor = require('pict-section-formeditor');

// In your PictApplication subclass:
onAfterInitializeAsync(fCallback)
{
    // Seed an empty manifest (or load one from your API)
    this.pict.AppData.FormConfig =
    {
        Scope: 'MyForm',
        Sections: [],
        Descriptors: {}
    };

    // Create the editor view
    this.pict.addView('FormEditor',
    {
        ViewIdentifier: 'FormEditor',
        ManifestDataAddress: 'AppData.FormConfig',
        DefaultDestinationAddress: '#FormEditor-Container',
        ActiveTab: 'visual'
    }, libPictSectionFormEditor);

    this.pict.views.FormEditor.initialize();
    this.pict.views.FormEditor.render();

    return super.onAfterInitializeAsync(fCallback);
}
```

### HTML Setup

Your page needs two things: the Pict CSS injection target and a container element.

```html
<style id="PICT-CSS"></style>
<div id="FormEditor-Container"></div>
```

The editor injects all of its CSS into `#PICT-CSS` at runtime, so no external stylesheet is required beyond whatever your application already provides.

## Editor Tabs

The editor provides several tabs along the top:

| Tab | Purpose |
|---|---|
| **Visual Editor** | Drag-and-drop form layout with inline property editing |
| **JSON** | Raw manifest JSON editing with syntax highlighting (CodeJar) |
| **Preview** | Live rendered form using a child pict instance |
| **Help** | Context-sensitive documentation browser |

### Visual Editor

The visual editor displays the manifest as a hierarchy of sections, groups, rows, and inputs. Each element can be selected to open its properties in the right-hand panel.

- **Sections** are the top-level containers. Add new sections with the toolbar button.
- **Groups** organize inputs within a section. Each section has a default group.
- **Rows** are horizontal containers inside groups. Inputs in the same row appear side by side.
- **Inputs** are the individual form fields. Each input maps to a Descriptor in the manifest.

### JSON Editor

Switches to a code editor where you can modify the manifest JSON directly. Changes are parsed and applied when you switch back to the visual editor.

### Preview

Click **Load Preview** to render the current manifest as a live pict-section-form. The preview uses a sandboxed child pict instance so it does not interfere with the editor's own state or CSS.

### Solver Editor

When editing a section's solvers, a dedicated panel opens with a code editor and two bottom tabs:

- **Expression Linter** -- Tokenizes the solver expression in real time and reports errors or warnings
- **Input Reference** -- Browse available data addresses from the manifest to use in expressions

## Configuration

Pass options when adding the view:

```javascript
this.pict.addView('FormEditor',
{
    ViewIdentifier: 'FormEditor',

    // Where the manifest lives in AppData
    ManifestDataAddress: 'AppData.FormConfig',

    // CSS selector for the container element
    DefaultDestinationAddress: '#FormEditor-Container',

    // Which tab to show first: 'visual', 'json', or 'preview'
    ActiveTab: 'visual'
}, libPictSectionFormEditor);
```

### Loading a Manifest

Set the manifest object at the configured `ManifestDataAddress` and re-render:

```javascript
this.pict.AppData.FormConfig = myLoadedManifest;
this.pict.views.FormEditor.render();
```

### Reading the Manifest Back

The editor modifies the manifest in place. Read it back from the same address:

```javascript
let tmpManifest = this.pict.AppData.FormConfig;
// POST it to your API, save to localStorage, etc.
```

## Architecture

The editor is decomposed into a main view and several providers:

| Module | Role |
|---|---|
| `PictView-FormEditor` | Main view -- tab switching, lifecycle, coordination |
| `PictView-FormEditor-PropertiesPanel` | Right-hand property editing, solver editor, preview |
| `PictView-FormEditor-InlineEditing` | Click-to-edit labels and values in the visual layout |
| `PictView-FormEditor-InputTypePicker` | Modal for selecting input types by category |
| `Pict-Provider-FormEditorRendering` | HTML generation for all visual editor elements |
| `Pict-Provider-FormEditorManifestOps` | CRUD operations on the manifest (add/move/delete) |
| `Pict-Provider-FormEditorDragDrop` | Drag-and-drop reordering of sections, groups, rows, inputs |
| `Pict-Provider-FormEditorUtilities` | String helpers, input type definitions, stats |
| `Pict-Provider-FormEditorIconography` | SVG icon set for the editor UI |
| `Pict-Provider-FormEditorDocumentation` | Embedded help content and topic index |
| `Pict-Provider-ChildPictManager` | Manages child pict instances for preview and solver linting |
| `Pict-Provider-PreviewCSS` | CSS isolation for child pict form previews |

## Example Application

A complete working example lives in `example_applications/form_editor/`. To run it:

```bash
cd example_applications/form_editor
npm install
npx quack build
```

Then open `html/index.html` in a browser. The example includes a manifest selector with several sample forms.

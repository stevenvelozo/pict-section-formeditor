// Pict Section: Form Editor
// A visual editor for pict-section-form configuration manifests.

// The main form editor view class
module.exports = require('./views/PictView-FormEditor.js');

// Default configuration
module.exports.default_configuration = require('./Pict-Section-FormEditor-DefaultConfiguration.js');

// Iconography provider for SVG icons
module.exports.IconographyProvider = require('./providers/Pict-Provider-FormEditorIconography.js');

// Rendering provider for visual editor HTML generation
module.exports.RenderingProvider = require('./providers/Pict-Provider-FormEditorRendering.js');

// Manifest operations provider for CRUD operations
module.exports.ManifestOpsProvider = require('./providers/Pict-Provider-FormEditorManifestOps.js');

// Drag-and-drop provider
module.exports.DragDropProvider = require('./providers/Pict-Provider-FormEditorDragDrop.js');

// Utilities provider for string helpers, InputType definitions, selection, and stats
module.exports.UtilitiesProvider = require('./providers/Pict-Provider-FormEditorUtilities.js');

// Properties panel view
module.exports.PropertiesPanel = require('./views/PictView-FormEditor-PropertiesPanel.js');

// Inline editing view
module.exports.InlineEditing = require('./views/PictView-FormEditor-InlineEditing.js');

// Input type picker view
module.exports.InputTypePicker = require('./views/PictView-FormEditor-InputTypePicker.js');

// Pict Section: Form Editor
// A visual editor for pict-section-form configuration manifests.

// The main form editor view class
module.exports = require('./views/PictView-FormEditor.js');

// Default configuration
module.exports.default_configuration = require('./Pict-Section-FormEditor-DefaultConfiguration.js');

// Iconography provider for SVG icons
module.exports.IconographyProvider = require('./providers/Pict-Provider-FormEditorIconography.js');

// Properties panel view
module.exports.PropertiesPanel = require('./views/PictView-FormEditor-PropertiesPanel.js');

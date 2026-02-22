module.exports = (
{
	ViewIdentifier: 'Pict-FormEditor',

	DefaultRenderable: 'FormEditor-Container',
	DefaultDestinationAddress: '#FormEditor-Container',

	AutoRender: false,

	// Address in AppData where the form configuration manifest lives
	ManifestDataAddress: false,

	// Which tab is active by default: 'visual', 'objecteditor', 'json'
	ActiveTab: 'visual',

	CSS: /*css*/`
.pict-formeditor
{
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	font-size: 14px;
	color: #3D3229;
	background: #FDFCFA;
	border: 1px solid #E8E3DA;
	border-radius: 6px;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	height: calc(100vh - 120px);
}

/* ---- Tab Bar ---- */
.pict-fe-tabbar
{
	display: flex;
	background: #F5F0E8;
	padding: 0;
	margin: 0;
}
.pict-fe-tab
{
	padding: 10px 20px;
	cursor: pointer;
	border: none;
	background: none;
	font-size: 13px;
	font-weight: 500;
	color: #8A7F72;
	border-top: 2px solid transparent;
	transition: color 0.15s, border-color 0.15s;
	user-select: none;
}
.pict-fe-tab:hover
{
	color: #3D3229;
	background: #EDE8DF;
}
.pict-fe-tab-active
{
	color: #3D3229;
	border-top-color: #9E6B47;
	background: #FDFCFA;
}

/* ---- Tab Content Panels ---- */
.pict-fe-tabcontent
{
	display: none;
	padding: 16px;
	flex: 1;
	min-height: 0;
	overflow: auto;
}
.pict-fe-tabcontent-active
{
	display: flex;
	flex-direction: column;
}

/* ---- Visual Editor ---- */
.pict-fe-visual-header
{
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 12px;
}
.pict-fe-visual-header h3
{
	margin: 0;
	font-size: 15px;
	font-weight: 600;
	color: #3D3229;
}
.pict-fe-btn
{
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 6px 12px;
	border-radius: 4px;
	border: 1px solid #C5BFAE;
	background: #F5F0E8;
	cursor: pointer;
	font-size: 12px;
	font-weight: 500;
	color: #3D3229;
	user-select: none;
	transition: background 0.1s, border-color 0.1s;
}
.pict-fe-btn:hover
{
	background: #E8E3DA;
	border-color: #B0A89E;
}
.pict-fe-btn-primary
{
	background: #9E6B47;
	border-color: #9E6B47;
	color: #FFF;
}
.pict-fe-btn-primary:hover
{
	background: #87593B;
	border-color: #87593B;
}
.pict-fe-btn-danger
{
	border-color: #E8C8C8;
	background: #FAF0F0;
	color: #A04040;
}
.pict-fe-btn-danger:hover
{
	background: #F0D6D6;
	border-color: #D4A0A0;
}
.pict-fe-btn-sm
{
	padding: 3px 8px;
	font-size: 11px;
}

/* ---- Section Cards ---- */
.pict-fe-sections-list
{
	display: flex;
	flex-direction: column;
	gap: 12px;
}
.pict-fe-section-card
{
	border: 1px solid #E8E3DA;
	border-radius: 6px;
	background: #FDFCFA;
}
.pict-fe-section-header
{
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10px 14px;
	background: #F5F0E8;
	border-bottom: 1px solid #E8E3DA;
	border-radius: 6px 6px 0 0;
}
.pict-fe-section-header:hover
{
	background: #EDE8DF;
}
.pict-fe-section-header-labels
{
	display: flex;
	align-items: center;
	flex: 1;
	min-width: 0;
	gap: 8px;
}
.pict-fe-section-title
{
	font-weight: 600;
	font-size: 14px;
	color: #3D3229;
	cursor: pointer;
	border-bottom: 1px dashed transparent;
}
.pict-fe-section-title:hover
{
	border-bottom-color: #C5BFAE;
}
.pict-fe-section-hash
{
	font-size: 11px;
	color: #8A7F72;
	font-family: monospace;
	margin-left: auto;
	cursor: pointer;
	border-bottom: 1px dashed transparent;
}
.pict-fe-section-hash:hover
{
	border-bottom-color: #C5BFAE;
}
.pict-fe-section-actions
{
	display: flex;
	gap: 6px;
	align-items: center;
	margin-left: 12px;
	flex-shrink: 0;
}
.pict-fe-section-body
{
	padding: 12px 14px;
}

/* ---- Inline Edit Modal ---- */
.pict-fe-inline-edit-input
{
	padding: 2px 6px;
	border: 1px solid #9E6B47;
	border-radius: 3px;
	font-size: inherit;
	font-family: inherit;
	color: #3D3229;
	background: #FFF;
	box-shadow: 0 0 0 2px rgba(158, 107, 71, 0.15);
	outline: none;
	min-width: 80px;
}
.pict-fe-inline-edit-input.pict-fe-inline-edit-hash
{
	font-family: monospace;
	font-size: 11px;
	text-align: right;
}
.pict-fe-inline-edit-select
{
	padding: 1px 4px;
	border: 1px solid #9E6B47;
	border-radius: 3px;
	font-size: 11px;
	font-family: inherit;
	color: #3D3229;
	background: #FFF;
	box-shadow: 0 0 0 2px rgba(158, 107, 71, 0.15);
	outline: none;
	cursor: pointer;
}

/* ---- Group Cards ---- */
.pict-fe-groups-header
{
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 8px;
}
.pict-fe-groups-header h4
{
	margin: 0;
	font-size: 13px;
	font-weight: 600;
	color: #8A7F72;
	text-transform: uppercase;
	letter-spacing: 0.5px;
}
.pict-fe-groups-list
{
	display: flex;
	flex-direction: column;
	gap: 8px;
}
.pict-fe-group-card
{
	border: 1px solid #E8E3DA;
	border-radius: 4px;
	background: #FFF;
}
.pict-fe-group-header
{
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 8px 12px;
	background: #FAFAF8;
	border-bottom: 1px solid #F0ECE4;
	border-radius: 4px 4px 0 0;
}
.pict-fe-group-header-labels
{
	display: flex;
	align-items: center;
	flex: 1;
	min-width: 0;
	gap: 6px;
}
.pict-fe-group-title
{
	font-weight: 500;
	font-size: 13px;
	color: #3D3229;
	cursor: pointer;
	border-bottom: 1px dashed transparent;
}
.pict-fe-group-title:hover
{
	border-bottom-color: #C5BFAE;
}
.pict-fe-group-hash
{
	font-size: 11px;
	color: #B0A89E;
	font-family: monospace;
	margin-left: auto;
	cursor: pointer;
	border-bottom: 1px dashed transparent;
}
.pict-fe-group-hash:hover
{
	border-bottom-color: #C5BFAE;
}
.pict-fe-group-layout
{
	font-size: 11px;
	color: #6B7F5A;
	background: #EEF3E8;
	border: 1px solid #D4E0C8;
	border-radius: 9px;
	padding: 1px 8px;
	cursor: pointer;
	font-weight: 500;
	transition: background 0.1s, border-color 0.1s;
}
.pict-fe-group-layout:hover
{
	background: #E0EBD6;
	border-color: #B8CBa8;
}
.pict-fe-group-body
{
	padding: 8px 12px;
}
.pict-fe-group-fields
{
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 6px;
}
.pict-fe-group-actions
{
	display: flex;
	gap: 4px;
	align-items: center;
	margin-left: 12px;
	flex-shrink: 0;
}

/* ---- Inline Field Editor ---- */
.pict-fe-field-label
{
	font-size: 11px;
	color: #8A7F72;
	margin-bottom: 2px;
}
.pict-fe-field-input
{
	width: 100%;
	padding: 4px 8px;
	border: 1px solid #E8E3DA;
	border-radius: 3px;
	font-size: 13px;
	font-family: inherit;
	color: #3D3229;
	background: #FFF;
	box-sizing: border-box;
}
.pict-fe-field-input:focus
{
	outline: none;
	border-color: #9E6B47;
	box-shadow: 0 0 0 2px rgba(158, 107, 71, 0.15);
}
.pict-fe-field-select
{
	width: 100%;
	padding: 4px 8px;
	border: 1px solid #E8E3DA;
	border-radius: 3px;
	font-size: 13px;
	font-family: inherit;
	color: #3D3229;
	background: #FFF;
	box-sizing: border-box;
}

/* ---- Row and Input ---- */
.pict-fe-group-body
{
	padding: 8px 12px;
}
.pict-fe-row
{
	border: 1px solid #F0ECE4;
	border-radius: 4px;
	margin-bottom: 6px;
	background: #FDFCFA;
}
.pict-fe-row-header
{
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 4px 8px;
	background: #F9F7F3;
	border-bottom: 1px solid #F0ECE4;
	border-radius: 4px 4px 0 0;
}
.pict-fe-row-label
{
	font-size: 10px;
	font-weight: 500;
	color: #C5BFAE;
	text-transform: uppercase;
	letter-spacing: 0.3px;
	margin-left: 4px;
}
.pict-fe-row-actions
{
	display: flex;
	gap: 3px;
	align-items: center;
	opacity: 0;
	transition: opacity 0.15s;
}
.pict-fe-row:hover .pict-fe-row-actions
{
	opacity: 1;
}
.pict-fe-row-inputs
{
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	padding: 6px 8px;
	align-items: center;
	min-height: 28px;
}
.pict-fe-input
{
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 3px 8px;
	border: 1px solid #E8E3DA;
	border-radius: 3px;
	background: #FFF;
	font-size: 12px;
	cursor: pointer;
	transition: background 0.1s, border-color 0.1s;
}
.pict-fe-input:hover
{
	border-color: #C5BFAE;
	background: #F9F7F3;
}
.pict-fe-input-selected
{
	border-color: #9E6B47;
	background: #FBF5EF;
	box-shadow: 0 0 0 1px #9E6B47;
}
.pict-fe-input-ordinal
{
	font-size: 9px;
	color: #B0A89E;
	min-width: 14px;
	text-align: center;
}
.pict-fe-input-name
{
	font-size: 11px;
	color: #3D3229;
	font-weight: 500;
	white-space: nowrap;
}
.pict-fe-input-remove
{
	padding: 1px 4px;
	font-size: 10px;
	opacity: 0;
	transition: opacity 0.15s;
}
.pict-fe-input:hover .pict-fe-input-remove
{
	opacity: 1;
}
.pict-fe-add-input
{
	opacity: 0.3;
	transition: opacity 0.15s;
}
.pict-fe-row-inputs:hover .pict-fe-add-input
{
	opacity: 1;
}
.pict-fe-add-row
{
	opacity: 0.3;
	transition: opacity 0.15s;
	margin-top: 4px;
}
.pict-fe-group-card:hover .pict-fe-add-row
{
	opacity: 1;
}

/* ---- Tabular / RecordSet Group Body ---- */
.pict-fe-tabular-body
{
	padding: 10px 12px;
}
.pict-fe-tabular-fields
{
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px;
	margin-bottom: 10px;
}
.pict-fe-tabular-field
{
	display: flex;
	flex-direction: column;
	gap: 2px;
}
.pict-fe-field-label
{
	font-size: 10px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	color: #8B7E6A;
}
.pict-fe-field-input
{
	font-family: inherit;
	font-size: 12px;
	padding: 4px 6px;
	border: 1px solid #E0DBCF;
	border-radius: 3px;
	background: #FFFCF7;
	color: #264653;
}
.pict-fe-field-input:focus
{
	outline: none;
	border-color: #9E6B47;
	box-shadow: 0 0 0 2px rgba(158,107,71,0.1);
}
.pict-fe-field-select
{
	font-family: inherit;
	font-size: 12px;
	padding: 4px 6px;
	border: 1px solid #E0DBCF;
	border-radius: 3px;
	background: #FFFCF7;
	color: #264653;
	min-width: 0;
	flex: 1;
}
.pict-fe-field-select:focus
{
	outline: none;
	border-color: #9E6B47;
	box-shadow: 0 0 0 2px rgba(158,107,71,0.1);
}
.pict-fe-tabular-columns-header
{
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 4px 0;
	margin-bottom: 6px;
	border-top: 1px solid #F0ECE4;
	padding-top: 8px;
}
.pict-fe-tabular-columns-list
{
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	padding: 6px 0;
	align-items: center;
	min-height: 28px;
}
.pict-fe-refmanifest-selector
{
	display: flex;
	gap: 4px;
	align-items: center;
}
.pict-fe-refmanifest-selector select
{
	flex: 1;
	min-width: 0;
}
.pict-fe-refmanifest-badge
{
	font-size: 10px;
	color: #6B7F5A;
	background: #EEF3E8;
	border: 1px solid #D4E0C8;
	border-radius: 9px;
	padding: 2px 10px;
	margin-bottom: 10px;
	display: inline-block;
	font-weight: 500;
}

/* ---- Iconography ---- */
.pict-fe-icon
{
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	line-height: 0;
}
.pict-fe-icon svg
{
	display: block;
}
.pict-fe-icon-section
{
	opacity: 0.7;
}
.pict-fe-icon-group
{
	opacity: 0.6;
}
.pict-fe-icon-row
{
	opacity: 0.45;
}
.pict-fe-icon-input
{
	opacity: 0.4;
}
.pict-fe-icon-datatype
{
	opacity: 0.55;
}
.pict-fe-icon-inputtype-chip
{
	margin-right: 2px;
	opacity: 0.7;
}
.pict-fe-icon-picker
{
	margin-right: 4px;
	opacity: 0.65;
	vertical-align: middle;
}
.pict-fe-icon-add
{
	opacity: 0.8;
	margin-right: 2px;
}

/* ---- Drag and Drop ---- */
.pict-fe-drag-handle
{
	cursor: grab;
	opacity: 0.35;
	margin-right: 4px;
	display: inline-flex;
	align-items: center;
	transition: opacity 0.15s;
}
.pict-fe-drag-handle:hover
{
	opacity: 0.7;
}
.pict-fe-drag-handle:active
{
	cursor: grabbing;
}
.pict-fe-dragging
{
	opacity: 0.4;
}
.pict-fe-drag-over
{
	outline: 2px dashed #9E6B47;
	outline-offset: -2px;
	background: rgba(158, 107, 71, 0.05);
}

/* ---- Editor Layout: tab content + toggle + properties panel ---- */
.pict-fe-editor-layout
{
	display: flex;
	gap: 0;
	flex: 1;
	min-height: 0;
	overflow: hidden;
}
.pict-fe-editor-content
{
	flex: 1;
	min-width: 300px;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}
.pict-fe-panel-toggle
{
	width: 14px;
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	cursor: col-resize;
	background: #F0ECE4;
	border: 1px solid #E8E3DA;
	border-radius: 6px;
	margin: 6px 0;
	color: #B0A89E;
	font-size: 10px;
	user-select: none;
	transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.pict-fe-panel-toggle:hover
{
	background: #E8E3DA;
	border-color: #D4CFC6;
	color: #3D3229;
}
.pict-fe-panel-toggle:active
{
	background: #DDD7CC;
	border-color: #C5BFAE;
}
.pict-fe-panel-toggle-grip
{
	width: 4px;
	height: 32px;
	border-radius: 2px;
	background: #CBC4B8;
	transition: background 0.15s;
}
.pict-fe-panel-toggle:hover .pict-fe-panel-toggle-grip
{
	background: #A89E92;
}
.pict-fe-properties-panel
{
	width: 0;
	overflow: hidden;
	border-left: 1px solid transparent;
	background: #FAFAF8;
	display: flex;
	flex-direction: column;
}
.pict-fe-properties-panel-open
{
	overflow-y: auto;
	overflow-x: hidden;
	border-left-color: #E8E3DA;
}

/* ---- Panel Tabs ---- */
.pict-fe-panel-tabbar
{
	display: flex;
	background: #F0ECE4;
	padding: 0;
	margin: 0;
	flex-shrink: 0;
	overflow: hidden;
	position: relative;
}
.pict-fe-panel-tab
{
	padding: 7px 8px;
	cursor: pointer;
	border: none;
	background: none;
	font-size: 11px;
	font-weight: 600;
	color: #8A7F72;
	border-top: 2px solid transparent;
	transition: color 0.15s, border-color 0.15s;
	text-align: center;
	user-select: none;
	white-space: nowrap;
	flex-shrink: 0;
}
.pict-fe-panel-tab:hover
{
	color: #3D3229;
	background: #E8E3DA;
}
.pict-fe-panel-tab-active
{
	color: #3D3229;
	border-top-color: #9E6B47;
	background: #FAFAF8;
}
/* Overflow hamburger menu button */
.pict-fe-panel-tab-overflow-btn
{
	display: none;
	padding: 7px 8px;
	cursor: pointer;
	border: none;
	background: #F0ECE4;
	font-size: 13px;
	font-weight: 600;
	color: #8A7F72;
	border-top: 2px solid transparent;
	user-select: none;
	flex-shrink: 0;
	margin-left: auto;
	position: relative;
}
.pict-fe-panel-tab-overflow-btn:hover
{
	color: #3D3229;
	background: #E8E3DA;
}
.pict-fe-panel-tab-overflow-btn-visible
{
	display: block;
}
/* Dropdown menu for overflowed tabs */
.pict-fe-panel-tab-overflow-menu
{
	display: none;
	position: absolute;
	top: 100%;
	right: 0;
	background: #FDFCFA;
	border: 1px solid #E8E3DA;
	border-radius: 0 0 4px 4px;
	box-shadow: 0 4px 12px rgba(61, 50, 41, 0.12);
	z-index: 20;
	min-width: 100px;
}
.pict-fe-panel-tab-overflow-menu-open
{
	display: block;
}
.pict-fe-panel-tab-overflow-item
{
	display: block;
	width: 100%;
	padding: 8px 14px;
	border: none;
	background: none;
	font-size: 12px;
	font-weight: 500;
	color: #8A7F72;
	text-align: left;
	cursor: pointer;
	white-space: nowrap;
}
.pict-fe-panel-tab-overflow-item:hover
{
	background: #F5F0E8;
	color: #3D3229;
}
.pict-fe-panel-tab-overflow-item-active
{
	color: #9E6B47;
	font-weight: 600;
}
.pict-fe-panel-tab-content
{
	display: none;
}
.pict-fe-panel-tab-content-active
{
	display: block;
	flex: 1;
	overflow-y: auto;
	min-height: 0;
}

/* ---- Form Dashboard ---- */
.pict-fe-form-identity
{
	padding: 12px 12px 4px 12px;
}
.pict-fe-form-identity-heading
{
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	color: #9E6B47;
	margin-bottom: 8px;
}
.pict-fe-form-field
{
	margin-bottom: 8px;
}
.pict-fe-form-field-label
{
	display: block;
	font-size: 11px;
	font-weight: 600;
	color: #8A7F72;
	margin-bottom: 3px;
}
.pict-fe-form-dashboard-heading
{
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	color: #9E6B47;
	padding: 8px 12px 4px 12px;
}

/* ---- Stats Grid ---- */
.pict-fe-stats-grid
{
	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	gap: 6px;
	padding: 4px 12px 8px 12px;
}
.pict-fe-stats-card
{
	background: #FFF;
	border: 1px solid #E8E3DA;
	border-radius: 5px;
	padding: 8px 6px;
	text-align: center;
}
.pict-fe-stats-value
{
	font-size: 20px;
	font-weight: 700;
	color: #9E6B47;
	line-height: 1.1;
	margin-bottom: 2px;
}
.pict-fe-stats-label
{
	font-size: 8px;
	text-transform: uppercase;
	letter-spacing: 0.4px;
	color: #8A7F72;
	font-weight: 600;
}

/* ---- Histogram Bars ---- */
.pict-fe-histogram
{
	padding: 4px 12px 8px 12px;
}
.pict-fe-histogram-row
{
	display: flex;
	align-items: center;
	gap: 6px;
	margin-bottom: 4px;
	font-size: 11px;
}
.pict-fe-histogram-label
{
	flex: 0 0 80px;
	color: #3D3229;
	font-weight: 500;
	text-align: right;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.pict-fe-histogram-bar-wrap
{
	flex: 1;
	display: block;
	height: 14px;
	background: #F5F0E8;
	border-radius: 3px;
	overflow: hidden;
}
.pict-fe-histogram-bar
{
	display: block;
	height: 100%;
	background: #D4A373;
	border-radius: 3px;
	min-width: 2px;
	transition: width 0.2s ease;
}
.pict-fe-histogram-count
{
	flex: 0 0 24px;
	text-align: right;
	font-weight: 600;
	color: #9E6B47;
	font-size: 11px;
}

/* ---- Input Selector ---- */
.pict-fe-input-selector
{
	padding: 8px 12px;
	border-bottom: 1px solid #E8E3DA;
}
.pict-fe-input-selector-select
{
	width: 100%;
	padding: 5px 8px;
	border: 1px solid #E8E3DA;
	border-radius: 3px;
	font-size: 12px;
	font-family: inherit;
	color: #3D3229;
	background: #FFF;
	box-sizing: border-box;
	cursor: pointer;
}
.pict-fe-input-selector-select:focus
{
	outline: none;
	border-color: #9E6B47;
	box-shadow: 0 0 0 2px rgba(158, 107, 71, 0.15);
}

/* ---- Properties Panel ---- */
.pict-fe-props-header
{
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10px 12px;
	border-bottom: 1px solid #E8E3DA;
	background: #F5F0E8;
	flex-shrink: 0;
}
.pict-fe-props-header-title
{
	font-size: 12px;
	font-weight: 600;
	color: #3D3229;
	text-transform: uppercase;
	letter-spacing: 0.4px;
}
.pict-fe-props-close
{
	background: none;
	border: none;
	font-size: 16px;
	color: #8A7F72;
	cursor: pointer;
	padding: 0 4px;
	line-height: 1;
}
.pict-fe-props-close:hover
{
	color: #A04040;
}
.pict-fe-props-body
{
	padding: 12px;
}
.pict-fe-props-field
{
	margin-bottom: 10px;
}
.pict-fe-props-label
{
	font-size: 10px;
	text-transform: uppercase;
	letter-spacing: 0.4px;
	color: #8A7F72;
	margin-bottom: 3px;
}
.pict-fe-props-input
{
	width: 100%;
	padding: 5px 8px;
	border: 1px solid #E8E3DA;
	border-radius: 3px;
	font-size: 13px;
	font-family: inherit;
	color: #3D3229;
	background: #FFF;
	box-sizing: border-box;
}
.pict-fe-props-input:focus
{
	outline: none;
	border-color: #9E6B47;
	box-shadow: 0 0 0 2px rgba(158, 107, 71, 0.15);
}
.pict-fe-props-input-mono
{
	font-family: monospace;
	font-size: 12px;
}
.pict-fe-props-value-readonly
{
	font-family: monospace;
	font-size: 11px;
	color: #8A7F72;
	padding: 5px 8px;
	background: #F5F0E8;
	border-radius: 3px;
	word-break: break-all;
}
.pict-fe-props-inputtype-btn
{
	width: 100%;
	padding: 5px 8px;
	border: 1px solid #E8E3DA;
	border-radius: 3px;
	font-size: 13px;
	font-family: inherit;
	color: #3D3229;
	background: #FFF;
	cursor: pointer;
	text-align: left;
	box-sizing: border-box;
}
.pict-fe-props-inputtype-btn:hover
{
	border-color: #C5BFAE;
	background: #F9F7F3;
}
.pict-fe-props-address-row
{
	display: flex;
	align-items: center;
	gap: 4px;
}
.pict-fe-props-address-row .pict-fe-props-input
{
	flex: 1;
	min-width: 0;
}
.pict-fe-props-address-confirm,
.pict-fe-props-address-cancel
{
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	border: 1px solid #E8E3DA;
	border-radius: 3px;
	font-size: 14px;
	cursor: pointer;
	padding: 0;
	line-height: 1;
	flex-shrink: 0;
}
.pict-fe-props-address-confirm
{
	background: #E8F5E9;
	color: #2E7D32;
}
.pict-fe-props-address-confirm:hover
{
	background: #C8E6C9;
	border-color: #2E7D32;
}
.pict-fe-props-address-cancel
{
	background: #FFF;
	color: #A04040;
}
.pict-fe-props-address-cancel:hover
{
	background: #FFEBEE;
	border-color: #A04040;
}
.pict-fe-props-position-row
{
	display: flex;
	align-items: center;
	gap: 6px;
}
.pict-fe-props-position-label
{
	font-size: 12px;
	color: #8A7F72;
	font-weight: 600;
	white-space: nowrap;
}
.pict-fe-props-section-divider
{
	border-top: 1px solid #E8E3DA;
	margin: 14px 0 10px 0;
}
.pict-fe-props-solver-info
{
	padding: 0;
}
.pict-fe-props-solver-info-heading
{
	font-size: 11px;
	font-weight: 600;
	color: #9E6B47;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	margin-bottom: 6px;
}
.pict-fe-props-solver-info-label
{
	font-size: 9px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	color: #8A7F72;
	margin-top: 6px;
	margin-bottom: 2px;
}
.pict-fe-props-solver-info-expr
{
	font-family: monospace;
	font-size: 11px;
	color: #3D3229;
	background: #FAF8F5;
	border: 1px solid #E8E3DA;
	border-radius: 3px;
	padding: 3px 6px;
	margin: 2px 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.pict-fe-props-solver-info-assignment
{
	border-left: 3px solid #9E6B47;
	padding-left: 6px;
	font-weight: 600;
}
.pict-fe-props-solver-info-link
{
	cursor: pointer;
	transition: background 0.15s, border-color 0.15s;
}
.pict-fe-props-solver-info-link:hover
{
	background: #EDE8DF;
	border-color: #9E6B47;
	color: #5B3A20;
}
.pict-fe-props-placeholder
{
	font-size: 11px;
	color: #B0A89E;
	font-style: italic;
	text-align: center;
	padding: 8px;
}
.pict-fe-props-section-header
{
	font-size: 11px;
	font-weight: 600;
	color: #9E6B47;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	padding: 8px 12px 0 12px;
	margin-bottom: 10px;
}
.pict-fe-props-textarea
{
	width: 100%;
	padding: 6px 8px;
	border: 1px solid #E8E3DA;
	border-radius: 3px;
	font-family: monospace;
	font-size: 12px;
	color: #3D3229;
	background: #FFF;
	resize: vertical;
	box-sizing: border-box;
}
.pict-fe-props-textarea:focus
{
	border-color: #9E6B47;
	outline: none;
	box-shadow: 0 0 0 2px rgba(158, 107, 71, 0.12);
}
.pict-fe-props-checkbox-label
{
	display: flex;
	align-items: flex-start;
	gap: 6px;
	font-size: 11px;
	color: #5A5048;
	cursor: pointer;
	line-height: 1.4;
}
.pict-fe-props-checkbox
{
	margin-top: 2px;
	flex-shrink: 0;
}

/* ---- InputType Picker Overlay ---- */
.pict-fe-inputtype-overlay
{
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: 9999;
	overflow: hidden;
}
.pict-fe-inputtype-picker
{
	position: fixed;
	z-index: 10000;
	width: 340px;
	max-height: 420px;
	background: #FFF;
	border: 1px solid #D4CFC6;
	border-radius: 8px;
	box-shadow: 0 8px 24px rgba(61, 50, 41, 0.15), 0 2px 8px rgba(61, 50, 41, 0.08);
	overflow: hidden;
	display: flex;
	flex-direction: column;
}
.pict-fe-inputtype-picker-search
{
	padding: 10px 12px 8px 12px;
	border-bottom: 1px solid #F0ECE4;
}
.pict-fe-inputtype-picker-search-input
{
	width: 100%;
	padding: 7px 10px;
	border: 1px solid #D4CFC6;
	border-radius: 5px;
	font-size: 13px;
	font-family: inherit;
	color: #3D3229;
	background: #FDFCFA;
	box-sizing: border-box;
	outline: none;
	transition: border-color 0.15s, box-shadow 0.15s;
}
.pict-fe-inputtype-picker-search-input:focus
{
	border-color: #9E6B47;
	box-shadow: 0 0 0 2px rgba(158, 107, 71, 0.15);
}
.pict-fe-inputtype-picker-default
{
	padding: 4px 8px;
	border-bottom: 1px solid #F0ECE4;
}
.pict-fe-inputtype-picker-categories
{
	overflow-y: auto;
	flex: 1;
	padding: 4px 0;
}
.pict-fe-inputtype-picker-category
{
	padding: 0 0 2px 0;
}
.pict-fe-inputtype-picker-category-label
{
	padding: 8px 12px 3px 12px;
	font-size: 10px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.6px;
	color: #9E6B47;
}
.pict-fe-inputtype-picker-item
{
	padding: 6px 12px;
	cursor: pointer;
	transition: background 0.1s;
}
.pict-fe-inputtype-picker-item:hover
{
	background: #F5F0E8;
}
.pict-fe-inputtype-picker-item-active
{
	background: #EEF3E8;
}
.pict-fe-inputtype-picker-item-active:hover
{
	background: #E4EDD8;
}
.pict-fe-inputtype-picker-item-name
{
	display: flex;
	align-items: center;
	font-size: 13px;
	font-weight: 500;
	color: #3D3229;
}
.pict-fe-inputtype-picker-item-desc
{
	font-size: 11px;
	color: #8A7F72;
	margin-top: 1px;
}
.pict-fe-inputtype-picker-empty
{
	padding: 16px 12px;
	text-align: center;
	color: #B0A89E;
	font-style: italic;
	font-size: 12px;
}

/* ---- Manifest Summary ---- */
.pict-fe-manifest-summary
{
	margin-top: 6px;
	padding: 6px 8px;
	background: #F9F7F3;
	border: 1px solid #E8E3DA;
	border-radius: 4px;
	font-size: 11px;
	color: #5D544A;
}
.pict-fe-manifest-summary-error
{
	color: #A04040;
	font-style: italic;
	background: #FFF5F5;
	border-color: #E0B0B0;
}
.pict-fe-manifest-summary-stats
{
	display: flex;
	gap: 12px;
	margin-bottom: 3px;
}
.pict-fe-manifest-summary-stat
{
	white-space: nowrap;
}
.pict-fe-manifest-summary-stat strong
{
	color: #9E6B47;
	font-weight: 700;
}
.pict-fe-manifest-summary-types
{
	display: flex;
	flex-wrap: wrap;
	gap: 4px;
}
.pict-fe-manifest-summary-type
{
	font-size: 10px;
	padding: 1px 5px;
	background: #EDE8DF;
	border-radius: 3px;
	color: #8A7F72;
	white-space: nowrap;
}

/* ---- Solver List ---- */
.pict-fe-solver-list-header
{
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 6px;
}
.pict-fe-solver-list-title
{
	font-size: 10px;
	text-transform: uppercase;
	letter-spacing: 0.4px;
	color: #8A7F72;
}
.pict-fe-solver-add-btn
{
	padding: 2px 8px;
	border: 1px solid #D4CFC6;
	border-radius: 3px;
	background: #FFF;
	color: #9E6B47;
	font-size: 11px;
	font-weight: 600;
	cursor: pointer;
	line-height: 1.4;
}
.pict-fe-solver-add-btn:hover
{
	background: #F5F0E8;
	border-color: #9E6B47;
}
.pict-fe-solver-entry
{
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 6px 8px;
	margin-bottom: 4px;
	border: 1px solid #E8E3DA;
	border-radius: 4px;
	background: #FDFCFA;
	transition: border-color 0.1s, opacity 0.1s;
}
.pict-fe-solver-entry:hover
{
	border-color: #D4CFC6;
}
.pict-fe-solver-entry.pict-fe-dragging
{
	opacity: 0.4;
}
.pict-fe-solver-entry.pict-fe-drag-over
{
	outline: 2px dashed #9E6B47;
	outline-offset: -2px;
	background: rgba(158, 107, 71, 0.05);
}
.pict-fe-solver-expression
{
	width: 100%;
	padding: 4px 6px;
	border: 1px solid #E8E3DA;
	border-radius: 3px;
	font-family: monospace;
	font-size: 11px;
	color: #3D3229;
	background: #FFF;
	box-sizing: border-box;
}
.pict-fe-solver-expression:focus
{
	outline: none;
	border-color: #9E6B47;
	box-shadow: 0 0 0 2px rgba(158, 107, 71, 0.12);
}
.pict-fe-solver-bottom-row
{
	display: flex;
	align-items: center;
	justify-content: space-between;
}
.pict-fe-solver-bottom-left
{
	display: flex;
	align-items: center;
	gap: 2px;
}
.pict-fe-solver-bottom-right
{
	display: flex;
	align-items: center;
	gap: 2px;
}
.pict-fe-solver-ordinal
{
	width: 40px;
	padding: 2px 4px;
	border: 1px solid #E8E3DA;
	border-radius: 3px;
	font-family: monospace;
	font-size: 11px;
	color: #3D3229;
	background: #FFF;
	text-align: center;
	box-sizing: border-box;
}
.pict-fe-solver-ordinal:focus
{
	outline: none;
	border-color: #9E6B47;
	box-shadow: 0 0 0 2px rgba(158, 107, 71, 0.12);
}
.pict-fe-solver-btn
{
	padding: 1px 4px;
	border: 1px solid transparent;
	border-radius: 2px;
	background: none;
	cursor: pointer;
	font-size: 12px;
	line-height: 1;
	color: #B0A89E;
}
.pict-fe-solver-btn:hover
{
	color: #3D3229;
	background: #F0ECE4;
	border-color: #D4CFC6;
}
.pict-fe-solver-btn-remove,
.pict-fe-solver-btn-expand
{
	opacity: 0;
	transition: opacity 0.15s;
}
.pict-fe-solver-entry:hover .pict-fe-solver-btn-remove,
.pict-fe-solver-entry:hover .pict-fe-solver-btn-expand
{
	opacity: 1;
}
.pict-fe-solver-btn-remove
{
	color: #C0A0A0;
}
.pict-fe-solver-btn-remove:hover
{
	color: #A04040;
	background: #FFEBEE;
	border-color: #E0B0B0;
}
.pict-fe-solver-btn-armed
{
	opacity: 1 !important;
	color: #fff !important;
	background: #C0392B !important;
	border-color: #A93226 !important;
	font-size: 10px;
	padding: 1px 6px;
}
.pict-fe-solver-btn-armed:hover
{
	background: #A93226 !important;
}
.pict-fe-solver-drag-handle
{
	cursor: grab;
	opacity: 0.35;
	font-size: 10px;
	display: inline-flex;
	align-items: center;
	transition: opacity 0.15s;
	padding: 1px 2px;
	color: #8A7F72;
}
.pict-fe-solver-drag-handle:hover
{
	opacity: 0.7;
}
.pict-fe-solver-drag-handle:active
{
	cursor: grabbing;
}
.pict-fe-solver-empty
{
	padding: 8px;
	text-align: center;
	font-size: 11px;
	color: #B0A89E;
	font-style: italic;
}
.pict-fe-solver-btn-expand
{
	color: #B0A89E;
}
.pict-fe-solver-btn-expand:hover
{
	color: #9E6B47;
	background: #F5F0E8;
	border-color: #D4CFC6;
}

/* ---- Solver Code Editor ---- */
/* ---- Solver Editor / Reference Styles ---- */
.pict-fe-solver-code-editor-container
{
	width: 100%;
	min-height: 120px;
	border: 1px solid #E8E3DA;
	border-radius: 4px;
	overflow: auto;
	box-sizing: border-box;
}
.pict-fe-solver-code-editor-container:focus-within
{
	border-color: #9E6B47;
	box-shadow: 0 0 0 2px rgba(158, 107, 71, 0.15);
}
/* Remove pict-section-code default border since our container provides it */
.pict-fe-solver-code-editor-container .pict-code-editor-wrap
{
	border: none;
	border-radius: 0;
}
/* Warm palette overrides to match form editor */
.pict-fe-solver-code-editor-container .pict-code-editor
{
	background: #FDFCFA;
	color: #3D3229;
	caret-color: #9E6B47;
	font-size: 13px;
}
.pict-fe-solver-code-editor-container .pict-code-line-numbers
{
	background: #F5F0E8;
	border-right-color: #E8E3DA;
	color: #B0A89E;
}
/* Syntax highlighting token colors for solver DSL */
.pict-fe-solver-code-editor-container .keyword { color: #9E6B47; font-weight: 600; }
.pict-fe-solver-code-editor-container .string { color: #50A14F; }
.pict-fe-solver-code-editor-container .number { color: #986801; }
.pict-fe-solver-code-editor-container .property { color: #4078F2; }
.pict-fe-solver-code-editor-container .operator { color: #0184BC; }
.pict-fe-solver-modal-ordinal-row
{
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 8px;
	margin-top: 10px;
}
.pict-fe-solver-modal-reference
{
	margin-top: 14px;
	border-top: 1px solid #E8E3DA;
	padding-top: 12px;
	flex: 1;
	display: flex;
	flex-direction: column;
	min-height: 0;
}
.pict-fe-solver-modal-reference-header
{
	display: flex;
	align-items: center;
	gap: 10px;
	margin-bottom: 8px;
}
.pict-fe-solver-modal-reference-search
{
	flex: 1;
	padding: 4px 8px;
	border: 1px solid #E8E3DA;
	border-radius: 3px;
	font-size: 12px;
	color: #3D3229;
	background: #FFF;
	box-sizing: border-box;
}
.pict-fe-solver-modal-reference-search:focus
{
	outline: none;
	border-color: #9E6B47;
	box-shadow: 0 0 0 2px rgba(158, 107, 71, 0.12);
}
.pict-fe-solver-modal-reference-list
{
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	border: 1px solid #E8E3DA;
	border-radius: 4px;
	background: #FDFCFA;
}
.pict-fe-solver-modal-reference-group
{
	padding: 6px 10px 2px 10px;
	font-size: 9px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	color: #9E6B47;
	background: #F5F0E8;
	border-bottom: 1px solid #E8E3DA;
	position: sticky;
	top: 0;
}
.pict-fe-solver-modal-reference-item
{
	display: flex;
	flex-direction: column;
	padding: 5px 10px;
	cursor: pointer;
	border-bottom: 1px solid #F0ECE4;
	transition: background 0.1s;
}
.pict-fe-solver-modal-reference-item:last-child
{
	border-bottom: none;
}
.pict-fe-solver-modal-reference-item:hover
{
	background: #F5F0E8;
}
.pict-fe-solver-modal-reference-row
{
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 8px;
}
.pict-fe-solver-modal-reference-name
{
	font-size: 12px;
	font-weight: 600;
	color: #3D3229;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.pict-fe-solver-modal-reference-hash
{
	font-family: monospace;
	font-size: 10px;
	color: #8A7F72;
	white-space: nowrap;
	flex-shrink: 0;
}
.pict-fe-solver-modal-reference-address
{
	font-family: monospace;
	font-size: 10px;
	color: #B0A89E;
	white-space: nowrap;
	flex-shrink: 0;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
}
.pict-fe-solver-modal-reference-item-expanded
{
	background: #F5F0E8;
	border-left: 3px solid #9E6B47;
	padding-left: 9px;
}
.pict-fe-solver-modal-reference-insert-btn
{
	font-size: 12px;
	padding: 4px 14px;
	border: 1px solid #D4CFC6;
	border-radius: 4px;
	background: #FFF;
	color: #3D3229;
	cursor: pointer;
	font-weight: 500;
	flex-shrink: 0;
	transition: background 0.1s, color 0.1s, opacity 0.12s;
	opacity: 0;
	font-family: inherit;
}
.pict-fe-solver-modal-reference-item:hover .pict-fe-solver-modal-reference-insert-btn
{
	opacity: 1;
}
.pict-fe-solver-modal-reference-insert-btn:hover
{
	background: #9E6B47;
	color: #FFF;
	border-color: #9E6B47;
}
.pict-fe-solver-modal-reference-detail
{
	border-top: 1px dashed #D4CFC6;
	margin-top: 6px;
	padding-top: 6px;
}
.pict-fe-solver-modal-reference-detail-label
{
	font-size: 9px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	color: #8A7F72;
	margin-top: 4px;
	margin-bottom: 2px;
}
.pict-fe-solver-modal-reference-detail-equation
{
	font-family: monospace;
	font-size: 11px;
	color: #3D3229;
	background: #FAF8F5;
	border: 1px solid #E8E3DA;
	border-radius: 3px;
	padding: 3px 6px;
	margin: 2px 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.pict-fe-solver-modal-reference-detail-assignment
{
	border-left: 3px solid #9E6B47;
	font-weight: 600;
	padding-left: 6px;
}
.pict-fe-solver-modal-reference-detail-link
{
	cursor: pointer;
	transition: background 0.15s, border-color 0.15s;
}
.pict-fe-solver-modal-reference-detail-link:hover
{
	background: #EDE8DF;
	border-color: #9E6B47;
	color: #5B3A20;
}
.pict-fe-solver-modal-reference-detail-empty
{
	font-size: 10px;
	font-style: italic;
	color: #B0A89E;
	padding: 4px 0;
}
.pict-fe-solver-modal-btn
{
	padding: 6px 16px;
	border: 1px solid #D4CFC6;
	border-radius: 4px;
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	background: #FFF;
	color: #3D3229;
	transition: background 0.1s, border-color 0.1s;
}
.pict-fe-solver-modal-btn:hover
{
	background: #F5F0E8;
	border-color: #C5BFAE;
}
.pict-fe-solver-modal-btn-save
{
	background: #9E6B47;
	color: #FFF;
	border-color: #9E6B47;
}
.pict-fe-solver-modal-btn-save:hover
{
	background: #8A5C3A;
	border-color: #8A5C3A;
}

/* ---- Solver Editor Bottom Tabs ---- */
.pict-fe-solver-bottom-tabbar
{
	display: flex;
	gap: 0;
	border-bottom: 1px solid #E8E3DA;
	margin-top: 14px;
	flex-shrink: 0;
}
.pict-fe-solver-bottom-tab
{
	padding: 5px 12px;
	font-size: 11px;
	font-weight: 500;
	color: #8A7F72;
	background: none;
	border: none;
	border-bottom: 2px solid transparent;
	cursor: pointer;
	transition: color 0.12s, border-color 0.12s;
	font-family: inherit;
}
.pict-fe-solver-bottom-tab:hover
{
	color: #5B3A20;
}
.pict-fe-solver-bottom-tab-active
{
	color: #9E6B47;
	font-weight: 600;
	border-bottom-color: #9E6B47;
}
.pict-fe-solver-linter-spinner
{
	display: inline-block;
	width: 10px;
	height: 10px;
	margin-left: 6px;
	border: 1.5px solid #E8E3DA;
	border-top-color: #9E6B47;
	border-radius: 50%;
	opacity: 0;
	animation: pict-fe-solver-linter-spin 0.6s linear infinite;
	transition: opacity 0.1s;
	vertical-align: middle;
	position: relative;
	top: -0.5px;
}
.pict-fe-solver-linter-spinner-visible
{
	opacity: 0.7;
}
@keyframes pict-fe-solver-linter-spin
{
	to { transform: rotate(360deg); }
}
.pict-fe-solver-bottom-content
{
	display: none;
}
.pict-fe-solver-bottom-content-active
{
	display: flex;
	flex-direction: column;
	flex: 1;
	min-height: 0;
}

/* ---- Expression Linter ---- */
.pict-fe-solver-linter-output
{
	padding: 8px 0;
	flex: 1;
	min-height: 0;
	overflow-y: auto;
}
.pict-fe-solver-linter-section-label
{
	font-size: 9px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.4px;
	color: #8A7F72;
	margin-bottom: 4px;
}
.pict-fe-solver-linter-tokens
{
	display: flex;
	flex-wrap: wrap;
	gap: 3px;
	padding: 6px 8px;
	background: #FDFCFA;
	border: 1px solid #E8E3DA;
	border-radius: 4px;
	margin-bottom: 10px;
	min-height: 24px;
	align-items: center;
}
.pict-fe-solver-linter-token
{
	display: inline-block;
	padding: 2px 6px;
	border-radius: 3px;
	font-family: monospace;
	font-size: 12px;
	line-height: 1.4;
	white-space: nowrap;
}
.pict-fe-solver-linter-token-constant
{
	background: #FDF6EC;
	color: #986801;
}
.pict-fe-solver-linter-token-symbol
{
	background: #EEF3FF;
	color: #4078F2;
}
.pict-fe-solver-linter-token-operator
{
	background: #EAF5F8;
	color: #0184BC;
	font-weight: 600;
}
.pict-fe-solver-linter-token-function
{
	background: #F5ECE4;
	color: #9E6B47;
	font-weight: 600;
}
.pict-fe-solver-linter-token-string
{
	background: #EEF7EE;
	color: #50A14F;
}
.pict-fe-solver-linter-token-stateaddress
{
	background: #F0E8F5;
	color: #7C3AED;
}
.pict-fe-solver-linter-token-assignment
{
	background: #F5ECE4;
	color: #9E6B47;
	font-weight: 700;
}
.pict-fe-solver-linter-token-parenthesis
{
	background: #F0ECE4;
	color: #8A7F72;
	font-weight: 600;
}
.pict-fe-solver-linter-messages
{
	display: flex;
	flex-direction: column;
	gap: 4px;
}
.pict-fe-solver-linter-message
{
	font-size: 11px;
	padding: 5px 8px;
	border-radius: 3px;
	line-height: 1.4;
}
.pict-fe-solver-linter-message-error
{
	background: #FEF2F2;
	color: #991B1B;
	border-left: 3px solid #DC2626;
}
.pict-fe-solver-linter-message-warning
{
	background: #FFFBEB;
	color: #92400E;
	border-left: 3px solid #F59E0B;
}
.pict-fe-solver-linter-ok
{
	font-size: 11px;
	color: #166534;
	background: #F0FDF4;
	padding: 5px 8px;
	border-radius: 3px;
	border-left: 3px solid #22C55E;
}
.pict-fe-solver-linter-empty
{
	font-size: 11px;
	color: #B0A89E;
	font-style: italic;
	padding: 8px 0;
}
.pict-fe-solver-linter-token-link
{
	text-decoration: none;
	cursor: pointer;
}
.pict-fe-solver-linter-token-linked
{
	cursor: pointer;
	border-bottom: 1px dashed currentColor;
}
.pict-fe-solver-linter-token-link:hover .pict-fe-solver-linter-token-linked
{
	filter: brightness(0.85);
}
.pict-fe-solver-linter-docs
{
	display: flex;
	flex-wrap: wrap;
	gap: 4px 8px;
	padding: 6px 0;
}
.pict-fe-solver-linter-doc-link
{
	display: inline-block;
	font-size: 11px;
	color: #9E6B47;
	text-decoration: none;
	padding: 2px 8px;
	background: #FAF6F2;
	border: 1px solid #E8E3DA;
	border-radius: 3px;
	cursor: pointer;
	transition: background 0.12s, border-color 0.12s;
}
.pict-fe-solver-linter-doc-link:hover
{
	background: #F5ECE4;
	border-color: #D4C5B3;
}

/* ---- Searchable Selector Dropdown ---- */
.pict-fe-searchable-selector
{
	padding: 8px 12px;
	border-bottom: 1px solid #E8E3DA;
	position: relative;
}
.pict-fe-searchable-selector-input
{
	width: 100%;
	padding: 5px 8px;
	border: 1px solid #E8E3DA;
	border-radius: 3px;
	font-size: 12px;
	font-family: inherit;
	color: #3D3229;
	background: #FFF;
	box-sizing: border-box;
	cursor: text;
}
.pict-fe-searchable-selector-input:focus
{
	outline: none;
	border-color: #9E6B47;
	box-shadow: 0 0 0 2px rgba(158, 107, 71, 0.15);
}
.pict-fe-searchable-selector-input::placeholder
{
	color: #B0A89E;
	font-style: italic;
}
.pict-fe-searchable-selector-list
{
	display: none;
	position: absolute;
	left: 12px;
	right: 12px;
	top: 100%;
	max-height: 260px;
	overflow-y: auto;
	background: #FFF;
	border: 1px solid #D4CFC6;
	border-radius: 0 0 5px 5px;
	box-shadow: 0 6px 16px rgba(61, 50, 41, 0.12);
	z-index: 100;
	margin-top: -1px;
}
.pict-fe-searchable-selector-list-open
{
	display: block;
}
.pict-fe-searchable-selector-group-label
{
	padding: 6px 10px 2px 10px;
	font-size: 9px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	color: #9E6B47;
	background: #FAFAF8;
}
.pict-fe-searchable-selector-subgroup-label
{
	padding: 4px 10px 2px 18px;
	font-size: 9px;
	font-weight: 600;
	letter-spacing: 0.3px;
	color: #8A7F72;
	background: #FDFCFA;
}
.pict-fe-searchable-selector-item-indented
{
	padding-left: 22px;
}
.pict-fe-searchable-selector-item
{
	padding: 5px 10px;
	font-size: 12px;
	color: #3D3229;
	cursor: pointer;
	transition: background 0.08s;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.pict-fe-searchable-selector-item:hover
{
	background: #F5F0E8;
}
.pict-fe-searchable-selector-item-active
{
	background: #EEF3E8;
	font-weight: 500;
}
.pict-fe-searchable-selector-item-active:hover
{
	background: #E4EDD8;
}
.pict-fe-searchable-selector-empty
{
	padding: 10px;
	text-align: center;
	font-size: 11px;
	color: #B0A89E;
	font-style: italic;
}

/* ---- Empty State ---- */
.pict-fe-empty
{
	text-align: center;
	padding: 24px;
	color: #B0A89E;
	font-style: italic;
}

/* ---- JSON Tab (Code Editor) ---- */
.pict-fe-tabcontent .pict-code-editor-wrap
{
	flex: 1;
	min-height: 200px;
}

/* ---- Object Editor Tab ---- */
.pict-fe-tabcontent .pict-objecteditor
{
	flex: 1;
	min-height: 200px;
}

/* ---- Options Tab: Option Entries ---- */
.pict-fe-option-entries
{
	display: flex;
	flex-direction: column;
	gap: 0;
	margin-bottom: 8px;
}
.pict-fe-option-entry
{
	display: flex;
	align-items: center;
	gap: 4px;
	padding: 4px 0;
	border-bottom: 1px solid #E8E3DA;
	transition: background 0.1s;
}
.pict-fe-option-entry:hover
{
	background: #FAF8F5;
}
.pict-fe-option-entry-readonly
{
	cursor: default;
	padding: 3px 6px;
}
.pict-fe-option-drag-handle
{
	cursor: grab;
	color: #C4B9A8;
	font-size: 14px;
	flex-shrink: 0;
	width: 16px;
	text-align: center;
	user-select: none;
}
.pict-fe-option-drag-handle:active
{
	cursor: grabbing;
}
.pict-fe-option-id
{
	font-family: monospace;
	font-size: 12px;
	padding: 3px 6px;
	border: 1px solid #D4CFC6;
	border-radius: 3px;
	background: #FFF;
	color: #3D3229;
	width: 30%;
	min-width: 60px;
	flex-shrink: 0;
}
.pict-fe-option-text
{
	font-size: 12px;
	padding: 3px 6px;
	border: 1px solid #D4CFC6;
	border-radius: 3px;
	background: #FFF;
	color: #3D3229;
	flex: 1;
	min-width: 0;
}
.pict-fe-option-id-preview,
.pict-fe-option-text-preview
{
	font-size: 11px;
	color: #8A7F72;
}
.pict-fe-option-id-preview
{
	font-family: monospace;
	width: 30%;
	min-width: 60px;
	flex-shrink: 0;
}
.pict-fe-option-text-preview
{
	flex: 1;
	min-width: 0;
}
.pict-fe-option-remove
{
	background: none;
	border: none;
	color: #C4B9A8;
	cursor: pointer;
	font-size: 12px;
	padding: 2px 4px;
	border-radius: 3px;
	flex-shrink: 0;
	opacity: 0;
	transition: opacity 0.15s, background 0.1s, color 0.1s;
}
.pict-fe-option-entry:hover .pict-fe-option-remove
{
	opacity: 1;
}
.pict-fe-option-remove:hover
{
	background: #F0ECE4;
	color: #C0392B;
}
.pict-fe-option-remove-armed
{
	background: #C0392B !important;
	color: #FFF !important;
	opacity: 1 !important;
	font-size: 10px;
	padding: 2px 6px;
}
.pict-fe-option-add-btn
{
	display: block;
	width: 100%;
	padding: 6px;
	margin-top: 4px;
	margin-bottom: 12px;
	border: 1px dashed #C4B9A8;
	border-radius: 4px;
	background: transparent;
	color: #9E6B47;
	font-size: 12px;
	font-weight: 500;
	cursor: pointer;
	transition: background 0.1s, border-color 0.1s;
}
.pict-fe-option-add-btn:hover
{
	background: #FAF8F5;
	border-color: #9E6B47;
}

/* ---- Options Tab: Source Toggle ---- */
.pict-fe-option-source-toggle
{
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
	margin-bottom: 10px;
	padding: 6px 0;
}
.pict-fe-option-source-radio
{
	display: flex;
	align-items: center;
	gap: 3px;
	font-size: 12px;
	color: #3D3229;
	cursor: pointer;
}
.pict-fe-option-source-radio input[type="radio"]
{
	margin: 0;
	cursor: pointer;
}

/* ---- Options Tab: Named Option Lists ---- */
.pict-fe-named-list-card
{
	border: 1px solid #E8E3DA;
	border-radius: 6px;
	margin-bottom: 8px;
	overflow: hidden;
}
.pict-fe-named-list-header
{
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 10px;
	cursor: pointer;
	background: #FAF8F5;
	transition: background 0.1s;
	user-select: none;
}
.pict-fe-named-list-header:hover
{
	background: #F5F0E8;
}
.pict-fe-named-list-header-expanded
{
	background: #F5F0E8;
	border-bottom: 1px solid #E8E3DA;
	border-left: 3px solid #9E6B47;
	padding-left: 7px;
}
.pict-fe-named-list-arrow
{
	font-size: 12px;
	color: #8A7F72;
	flex-shrink: 0;
	width: 12px;
}
.pict-fe-named-list-name
{
	font-size: 13px;
	font-weight: 500;
	color: #3D3229;
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.pict-fe-named-list-count
{
	font-size: 10px;
	color: #8A7F72;
	flex-shrink: 0;
}
.pict-fe-named-list-body
{
	padding: 10px;
}
.pict-fe-named-list-props
{
	margin-top: 8px;
	border-top: 1px dashed #E8E3DA;
	padding-top: 8px;
}
.pict-fe-named-list-delete-btn
{
	display: block;
	width: 100%;
	padding: 5px;
	margin-top: 8px;
	border: 1px solid #D4CFC6;
	border-radius: 4px;
	background: transparent;
	color: #8A7F72;
	font-size: 11px;
	cursor: pointer;
	transition: background 0.1s, color 0.1s, border-color 0.1s;
}
.pict-fe-named-list-delete-btn:hover
{
	background: #FDF2F2;
	color: #C0392B;
	border-color: #E8A9A9;
}
.pict-fe-named-list-delete-btn-armed
{
	background: #C0392B !important;
	color: #FFF !important;
	border-color: #C0392B !important;
}
.pict-fe-named-list-add-btn
{
	display: block;
	width: 100%;
	padding: 8px;
	margin-top: 4px;
	border: 1px dashed #C4B9A8;
	border-radius: 4px;
	background: transparent;
	color: #9E6B47;
	font-size: 12px;
	font-weight: 500;
	cursor: pointer;
	transition: background 0.1s, border-color 0.1s;
}
.pict-fe-named-list-add-btn:hover
{
	background: #FAF8F5;
	border-color: #9E6B47;
}

/* ---- Data Tab: Section Dividers ---- */
.pict-fe-data-section-divider
{
	height: 1px;
	background: #E8E3DA;
	margin: 14px 0;
}

/* ---- Data Tab: Scope Selector ---- */
.pict-fe-data-scope-selector
{
	margin-bottom: 10px;
}

/* ---- Data Tab: PickList Cards ---- */
.pict-fe-picklist-card
{
	border: 1px solid #E8E3DA;
	border-radius: 6px;
	margin-bottom: 8px;
	overflow: hidden;
}
.pict-fe-picklist-header
{
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 10px;
	cursor: pointer;
	background: #FAF8F5;
	transition: background 0.1s;
	user-select: none;
}
.pict-fe-picklist-header:hover
{
	background: #F5F0E8;
}
.pict-fe-picklist-header-expanded
{
	background: #F5F0E8;
	border-bottom: 1px solid #E8E3DA;
	border-left: 3px solid #9E6B47;
	padding-left: 7px;
}
.pict-fe-picklist-name
{
	font-size: 13px;
	font-weight: 500;
	color: #3D3229;
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.pict-fe-picklist-body
{
	padding: 10px;
}

/* ---- Data Tab: Provider Entries ---- */
.pict-fe-provider-entry
{
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 6px 8px;
	border: 1px solid #E8E3DA;
	border-radius: 4px;
	margin-bottom: 4px;
	background: #FDFCFA;
	cursor: grab;
	transition: background 0.1s, box-shadow 0.1s;
}
.pict-fe-provider-entry:hover
{
	background: #FAF8F5;
	box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.pict-fe-provider-drag-handle
{
	color: #C4B9A8;
	font-size: 14px;
	cursor: grab;
	user-select: none;
	flex-shrink: 0;
}
.pict-fe-provider-drag-handle:active
{
	cursor: grabbing;
}
.pict-fe-provider-name
{
	font-size: 12px;
	font-weight: 500;
	color: #3D3229;
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.pict-fe-provider-remove
{
	background: none;
	border: none;
	color: #C4B9A8;
	font-size: 13px;
	cursor: pointer;
	padding: 2px 4px;
	border-radius: 3px;
	transition: color 0.1s, background 0.1s;
	flex-shrink: 0;
}
.pict-fe-provider-entry:hover .pict-fe-provider-remove
{
	color: #8A7F72;
}
.pict-fe-provider-remove:hover
{
	color: #C0392B;
	background: #FDF2F2;
}
.pict-fe-provider-remove-armed
{
	background: #C0392B !important;
	color: #FFF !important;
	font-size: 10px;
	font-weight: 600;
}
.pict-fe-provider-add-select
{
	width: 100%;
	padding: 6px 8px;
	margin-top: 4px;
	border: 1px dashed #C4B9A8;
	border-radius: 4px;
	background: transparent;
	color: #9E6B47;
	font-size: 12px;
	font-weight: 500;
	cursor: pointer;
	transition: background 0.1s, border-color 0.1s;
}
.pict-fe-provider-add-select:hover
{
	background: #FAF8F5;
	border-color: #9E6B47;
}

/* ---- Data Tab: Entity Bundle ---- */
.pict-fe-entity-bundle-card
{
	border: 1px solid #E8E3DA;
	border-radius: 6px;
	margin-bottom: 8px;
	overflow: hidden;
}
.pict-fe-entity-bundle-triggers
{
	margin-top: 10px;
	padding: 10px;
	border: 1px solid #E8E3DA;
	border-radius: 6px;
	background: #FAF8F5;
}

/* ---- Solvers Tab ---- */
.pict-fe-solvers-health-ok
{
	font-size: 12px;
	color: #5B6E5D;
	background: #F0F5F0;
	border: 1px solid #C5D8C5;
	border-left: 3px solid #6B8F5A;
	border-radius: 4px;
	padding: 8px 12px;
	margin: 8px 0;
}
.pict-fe-solvers-health-issue
{
	border: 1px solid #E8E3DA;
	border-radius: 4px;
	margin: 6px 0;
	overflow: hidden;
}
.pict-fe-solvers-health-issue-header
{
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 12px;
	background: #FFF;
	cursor: pointer;
	font-size: 12px;
	font-weight: 500;
	color: #3D3229;
	transition: background 0.15s;
}
.pict-fe-solvers-health-issue-header:hover
{
	background: #FAF8F5;
}
.pict-fe-solvers-health-issue-count
{
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 20px;
	height: 18px;
	padding: 0 6px;
	border-radius: 9px;
	font-size: 10px;
	font-weight: 700;
	color: #FFF;
}
.pict-fe-solvers-health-issue-items
{
	padding: 6px 12px 10px 12px;
	border-top: 1px solid #E8E3DA;
	background: #FDFCFA;
}
.pict-fe-solvers-health-issue-item
{
	font-family: monospace;
	font-size: 11px;
	color: #3D3229;
	background: #FAF8F5;
	border: 1px solid #E8E3DA;
	border-radius: 3px;
	padding: 3px 6px;
	margin: 2px 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	cursor: pointer;
	transition: background 0.15s, border-color 0.15s;
}
.pict-fe-solvers-health-issue-item:hover
{
	background: #EDE8DF;
	border-color: #9E6B47;
	color: #5B3A20;
}
.pict-fe-solvers-health-issue-detail
{
	font-size: 10px;
	color: #8A7F72;
	margin: 2px 0 4px 0;
}
.pict-fe-solvers-ordinal-group
{
	margin-bottom: 14px;
}
.pict-fe-solvers-ordinal-header
{
	font-size: 10px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	color: #9E6B47;
	margin-bottom: 6px;
	padding-bottom: 4px;
	border-bottom: 1px solid #E8E3DA;
}
.pict-fe-solvers-seq-entry
{
	display: flex;
	flex-direction: column;
	gap: 3px;
	padding: 6px 8px;
	margin-bottom: 4px;
	border: 1px solid #E8E3DA;
	border-radius: 4px;
	background: #FDFCFA;
	transition: border-color 0.15s;
}
.pict-fe-solvers-seq-entry:hover
{
	border-color: #D4CFC6;
}
.pict-fe-solvers-seq-meta
{
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 10px;
	color: #8A7F72;
}
.pict-fe-solvers-badge-section
{
	display: inline-block;
	padding: 1px 6px;
	border-radius: 3px;
	font-size: 9px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.3px;
	background: #F5EDE5;
	color: #9E6B47;
	border: 1px solid #E8DDD0;
}
.pict-fe-solvers-badge-group
{
	display: inline-block;
	padding: 1px 6px;
	border-radius: 3px;
	font-size: 9px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.3px;
	background: #E8EDF2;
	color: #5A7F9E;
	border: 1px solid #D0D8E0;
}
.pict-fe-solvers-flow-node
{
	border: 1px solid #E8E3DA;
	border-radius: 5px;
	margin-bottom: 8px;
	background: #FDFCFA;
	overflow: hidden;
}
.pict-fe-solvers-flow-hash
{
	font-family: monospace;
	font-size: 12px;
	font-weight: 700;
	color: #3D3229;
	padding: 8px 12px;
	background: #F5F0E8;
	border-bottom: 1px solid #E8E3DA;
}
.pict-fe-solvers-flow-relationship
{
	display: flex;
	align-items: flex-start;
	gap: 6px;
	padding: 4px 12px 4px 20px;
}
.pict-fe-solvers-flow-relationship:last-child
{
	padding-bottom: 8px;
}
.pict-fe-solvers-flow-arrow
{
	flex-shrink: 0;
	font-size: 13px;
	line-height: 20px;
	color: #9E6B47;
}
.pict-fe-solvers-flow-label
{
	flex-shrink: 0;
	font-size: 9px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.3px;
	color: #8A7F72;
	line-height: 20px;
	min-width: 80px;
}
.pict-fe-solvers-flow-expr
{
	flex: 1;
	min-width: 0;
}

/* ---- Solver Editor Tab ---- */
.pict-fe-solver-editor-breadcrumb
{
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 2px;
	padding: 8px 12px;
	margin-bottom: 10px;
	background: #F5F0E8;
	border: 1px solid #E8E3DA;
	border-radius: 4px;
	font-size: 11px;
	color: #8A7F72;
}
.pict-fe-solver-editor-breadcrumb-item
{
	cursor: pointer;
	color: #9E6B47;
	padding: 2px 4px;
	border-radius: 3px;
	transition: background 0.15s;
	max-width: 220px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.pict-fe-solver-editor-breadcrumb-item:hover
{
	background: #EDE8DF;
	color: #5B3A20;
}
.pict-fe-solver-editor-breadcrumb-sep
{
	color: #C4B9A8;
	font-size: 10px;
	user-select: none;
}
.pict-fe-solver-editor-breadcrumb-current
{
	font-weight: 600;
	color: #3D3229;
	padding: 2px 4px;
	max-width: 280px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.pict-fe-solver-editor-header
{
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 0 0 10px 0;
	margin-bottom: 10px;
	border-bottom: 1px solid #E8E3DA;
	font-size: 12px;
	color: #3D3229;
}
.pict-fe-solver-editor-header-context
{
	font-size: 11px;
	color: #8A7F72;
}
.pict-fe-solver-editor-body
{
	display: flex;
	flex-direction: column;
	gap: 10px;
	flex: 1;
	min-height: 0;
}
.pict-fe-solver-editor-actions
{
	display: flex;
	justify-content: flex-end;
	gap: 8px;
	padding: 10px 16px;
	border-top: 1px solid #E8E3DA;
	background: #FDFCFA;
	position: sticky;
	bottom: -16px;
	margin: 0 -16px -16px -16px;
	z-index: 2;
}
.pict-fe-solver-editor-list-heading
{
	font-size: 12px;
	font-weight: 600;
	color: #3D3229;
	margin-bottom: 8px;
}
.pict-fe-solver-editor-list-empty
{
	font-size: 12px;
	color: #8A7F72;
	padding: 8px 0;
}
/* ---- Add Solver Helper ---- */
.pict-fe-add-solver-helper
{
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 0;
}
.pict-fe-add-solver-helper select
{
	flex: 1;
	padding: 5px 8px;
	border: 1px solid #D4CFC6;
	border-radius: 4px;
	background: #FFF;
	color: #3D3229;
	font-size: 12px;
	font-family: inherit;
}
.pict-fe-add-solver-helper select:focus
{
	outline: none;
	border-color: #9E6B47;
	box-shadow: 0 0 0 2px rgba(158, 107, 71, 0.1);
}

/* ---- Preview Tab ---- */
.pict-fe-preview-container
{
	display: flex;
	flex-direction: column;
	flex: 1;
	min-height: 0;
}
.pict-fe-preview-actions
{
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 0 0 8px 0;
	flex-shrink: 0;
}
.pict-fe-preview-load-btn
{
	padding: 5px 14px;
	font-size: 11px;
	font-weight: 600;
	font-family: inherit;
	color: #FDFCFA;
	background: #9E6B47;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	transition: background 0.12s;
}
.pict-fe-preview-load-btn:hover
{
	background: #7D5436;
}
.pict-fe-preview-status
{
	font-size: 11px;
	color: #8A7F72;
	font-style: italic;
}
.pict-fe-preview-viewport
{
	flex: 1;
	min-height: 0;
	overflow: auto;
	border: 1px solid #E8E3DA;
	border-radius: 4px;
	background: #FFFFFF;
	padding: 12px;
}
.pict-fe-preview-placeholder
{
	font-size: 12px;
	color: #B0A89E;
	font-style: italic;
	text-align: center;
	padding: 24px 0;
}
.pict-fe-preview-loading
{
	font-size: 12px;
	color: #8A7F72;
	font-style: italic;
	text-align: center;
	padding: 24px 0;
}
.pict-fe-preview-error
{
	font-size: 12px;
	color: #991B1B;
	background: #FEF2F2;
	border: 1px solid #FCA5A5;
	border-radius: 4px;
	padding: 10px 12px;
}

/* ---- Help Tab ---- */
.pict-fe-help-container
{
	display: flex;
	flex-direction: column;
	flex: 1;
	overflow: hidden;
	min-height: 0;
}
.pict-fe-help-nav
{
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 4px 12px;
	font-size: 11px;
	color: #8A7F72;
	flex-shrink: 0;
}
.pict-fe-help-nav:empty
{
	display: none;
}
.pict-fe-help-nav a
{
	color: #9E6B47;
	text-decoration: none;
	cursor: pointer;
}
.pict-fe-help-nav a:hover
{
	text-decoration: underline;
}
.pict-fe-help-nav .pict-fe-help-nav-sep
{
	color: #D4CFC6;
}
.pict-fe-help-body
{
	flex: 1;
	overflow-y: auto;
}
/* Scale down pict-content base styles for sidebar context */
.pict-fe-help-body .pict-content
{
	max-width: none !important;
	padding: 12px !important;
	margin: 0 !important;
}
.pict-fe-help-body .pict-content h1
{
	font-size: 1.3em !important;
	margin-top: 0 !important;
}
.pict-fe-help-body .pict-content h2
{
	font-size: 1.15em !important;
}
.pict-fe-help-body .pict-content h3
{
	font-size: 1.05em !important;
}
.pict-fe-help-body .pict-content p
{
	font-size: 13px !important;
	line-height: 1.6 !important;
}
.pict-fe-help-body .pict-content a
{
	color: #9E6B47 !important;
}
.pict-fe-help-body .pict-content code
{
	background: #F5F0E8 !important;
	color: #5B3A20 !important;
	padding: 1px 5px !important;
	border-radius: 3px !important;
	font-size: 12px !important;
}
.pict-fe-help-body .pict-content pre
{
	background: #F5F0E8 !important;
	color: #3D3229 !important;
	padding: 10px 16px !important;
	border-radius: 4px !important;
	overflow-x: auto !important;
	font-size: 12px !important;
	line-height: 1.5 !important;
	margin: 8px 0 !important;
}
.pict-fe-help-body .pict-content .pict-content-code-wrap pre,
.pict-fe-help-body .pict-content-code-wrap pre
{
	background: #F5F0E8 !important;
	color: #3D3229 !important;
	padding: 10px 16px 10px 56px !important;
	border-radius: 4px !important;
	overflow-x: auto !important;
	font-size: 12px !important;
	line-height: 1.5 !important;
	margin: 0 !important;
}
.pict-fe-help-body .pict-content pre code,
.pict-fe-help-body .pict-content .pict-content-code-wrap pre code,
.pict-fe-help-body .pict-content-code-wrap pre code
{
	background: none !important;
	color: inherit !important;
	padding: 0 !important;
	font-size: inherit !important;
}
.pict-fe-help-body .pict-content .pict-content-code-wrap,
.pict-fe-help-body .pict-content-code-wrap
{
	margin: 8px 0 !important;
	background: #F5F0E8 !important;
	border-radius: 4px !important;
	border: 1px solid #E8E3DA !important;
	overflow-x: auto !important;
	overflow-y: hidden !important;
	font-size: 12px !important;
	line-height: 1.5 !important;
}
.pict-fe-help-body .pict-content .pict-content-code-wrap .pict-content-code-line-numbers,
.pict-fe-help-body .pict-content-code-wrap .pict-content-code-line-numbers
{
	background: #EDE8DF !important;
	border-right: 1px solid #DDD6CB !important;
	color: #A09589 !important;
	font-size: 12px !important;
	line-height: 1.5 !important;
	padding: 10px 0 !important;
}
.pict-fe-help-body .pict-content .pict-content-code-wrap .keyword,
.pict-fe-help-body .pict-content-code-wrap .keyword { color: #A626A4 !important; }
.pict-fe-help-body .pict-content .pict-content-code-wrap .string,
.pict-fe-help-body .pict-content-code-wrap .string { color: #50A14F !important; }
.pict-fe-help-body .pict-content .pict-content-code-wrap .number,
.pict-fe-help-body .pict-content-code-wrap .number { color: #986801 !important; }
.pict-fe-help-body .pict-content .pict-content-code-wrap .comment,
.pict-fe-help-body .pict-content-code-wrap .comment { color: #A0A1A7 !important; font-style: italic !important; }
.pict-fe-help-body .pict-content .pict-content-code-wrap .operator,
.pict-fe-help-body .pict-content-code-wrap .operator { color: #0184BC !important; }
.pict-fe-help-body .pict-content .pict-content-code-wrap .punctuation,
.pict-fe-help-body .pict-content-code-wrap .punctuation { color: #3D3229 !important; }
.pict-fe-help-body .pict-content .pict-content-code-wrap .function-name,
.pict-fe-help-body .pict-content-code-wrap .function-name { color: #4078F2 !important; }
.pict-fe-help-body .pict-content .pict-content-code-wrap .property,
.pict-fe-help-body .pict-content-code-wrap .property { color: #E45649 !important; }
.pict-fe-help-body .pict-content .pict-content-code-wrap .tag,
.pict-fe-help-body .pict-content-code-wrap .tag { color: #E45649 !important; }
.pict-fe-help-body .pict-content .pict-content-code-wrap .attr-name,
.pict-fe-help-body .pict-content-code-wrap .attr-name { color: #986801 !important; }
.pict-fe-help-body .pict-content .pict-content-code-wrap .attr-value,
.pict-fe-help-body .pict-content-code-wrap .attr-value { color: #50A14F !important; }
`,

	Templates:
	[
		{
			Hash: 'FormEditor-Container-Template',
			Template: '<div class="pict-formeditor" id="FormEditor-Wrap-{~D:Context[0].Hash~}"></div>'
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'FormEditor-Container',
			TemplateHash: 'FormEditor-Container-Template',
			DestinationAddress: '#FormEditor-Container',
			RenderMethod: 'replace'
		}
	]
});

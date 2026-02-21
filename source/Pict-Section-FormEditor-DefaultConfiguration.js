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
	border-bottom: 1px solid #E8E3DA;
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
	border-bottom: 2px solid transparent;
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
	border-bottom-color: #9E6B47;
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
	font-size: 11px;
	font-weight: 600;
	color: #B0A89E;
	text-transform: uppercase;
	letter-spacing: 0.3px;
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

/* ---- Two-column Visual Editor Layout ---- */
.pict-fe-visual-layout
{
	display: flex;
	gap: 0;
	flex: 1;
	min-height: 0;
	overflow: hidden;
}
.pict-fe-visual-main
{
	flex: 1;
	min-width: 0;
	overflow-y: auto;
	padding-right: 16px;
}
.pict-fe-panel-toggle
{
	width: 20px;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	background: #F5F0E8;
	border-left: 1px solid #E8E3DA;
	border-right: 1px solid #E8E3DA;
	color: #B0A89E;
	font-size: 10px;
	user-select: none;
	transition: background 0.15s, color 0.15s;
}
.pict-fe-panel-toggle:hover
{
	background: #EDE8DF;
	color: #3D3229;
}
.pict-fe-properties-panel
{
	width: 0;
	overflow: hidden;
	transition: width 0.2s;
	border-left: 1px solid transparent;
	background: #FAFAF8;
	display: flex;
	flex-direction: column;
}
.pict-fe-properties-panel-open
{
	width: 300px;
	overflow: hidden;
	border-left-color: #E8E3DA;
}

/* ---- Panel Tabs ---- */
.pict-fe-panel-tabbar
{
	display: flex;
	background: #F0ECE4;
	border-bottom: 1px solid #E8E3DA;
	padding: 0;
	margin: 0;
	flex-shrink: 0;
}
.pict-fe-panel-tab
{
	flex: 1;
	padding: 7px 8px;
	cursor: pointer;
	border: none;
	background: none;
	font-size: 11px;
	font-weight: 600;
	color: #8A7F72;
	border-bottom: 2px solid transparent;
	transition: color 0.15s, border-color 0.15s;
	text-align: center;
	user-select: none;
}
.pict-fe-panel-tab:hover
{
	color: #3D3229;
	background: #E8E3DA;
}
.pict-fe-panel-tab-active
{
	color: #3D3229;
	border-bottom-color: #9E6B47;
	background: #FAFAF8;
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

/* ---- Form Stats ---- */
.pict-fe-stats-grid
{
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px;
	padding: 12px;
}
.pict-fe-stats-card
{
	background: #FFF;
	border: 1px solid #E8E3DA;
	border-radius: 5px;
	padding: 10px;
	text-align: center;
}
.pict-fe-stats-value
{
	font-size: 22px;
	font-weight: 700;
	color: #9E6B47;
	line-height: 1.1;
	margin-bottom: 2px;
}
.pict-fe-stats-label
{
	font-size: 9px;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	color: #8A7F72;
	font-weight: 600;
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

/*---------------------------------------------------------------------------------------------
 *  CircuitForge — AI Hardware Design Studio
 *  Diagram Editor Panel — webview-based editor tab for breadboard visualization.
 *--------------------------------------------------------------------------------------------*/

import { EditorPane } from '../../../../browser/parts/editor/editorPane.js';
import { ITelemetryService } from '../../../../../platform/telemetry/common/telemetry.js';
import { IThemeService } from '../../../../../platform/theme/common/themeService.js';
import { IStorageService } from '../../../../../platform/storage/common/storage.js';
import { EditorInput } from '../../../../common/editor/editorInput.js';
import { IEditorGroup } from '../../../../services/editor/common/editorGroupsService.js';
import { URI } from '../../../../../base/common/uri.js';
import { HardwareDesignResult } from '../../common/types.js';
import { CIRCUITFORGE_DIAGRAM_EDITOR_ID } from '../../common/constants.js';
import { CancellationToken } from '../../../../../base/common/cancellation.js';
import { IEditorOptions } from '../../../../../platform/editor/common/editor.js';
import { Dimension } from '../../../../../base/browser/dom.js';
import { IWebviewService, IOverlayWebview } from '../../../../contrib/webview/browser/webview.js';
import { BreadboardRenderer } from '../webview/diagram/breadboardRenderer.js';
import { ComponentShapes } from '../webview/diagram/componentShapes.js';
import { WireRouter } from '../webview/diagram/wireRouter.js';

// ── Editor Input ─────────────────────────────────────────────────

export class DiagramEditorInput extends EditorInput {
	static readonly TypeID = 'workbench.input.circuitforgeDiagram';

	constructor(
		readonly resource: URI,
		readonly designResult: HardwareDesignResult,
	) {
		super();
	}

	override get typeId(): string { return DiagramEditorInput.TypeID; }
	override get editorId(): string { return CIRCUITFORGE_DIAGRAM_EDITOR_ID; }
	override getName(): string { return `Diagram: ${this.designResult.projectTitle}`; }
	override getDescription(): string { return 'Wiring Diagram'; }
}

// ── Editor Pane ──────────────────────────────────────────────────

export class DiagramEditorPane extends EditorPane {
	static readonly ID = CIRCUITFORGE_DIAGRAM_EDITOR_ID;

	private container!: HTMLElement;
	private webview: IOverlayWebview | undefined;

	constructor(
		group: IEditorGroup,
		@ITelemetryService telemetryService: ITelemetryService,
		@IThemeService themeService: IThemeService,
		@IStorageService storageService: IStorageService,
		@IWebviewService private readonly webviewService: IWebviewService,
	) {
		super(DiagramEditorPane.ID, group, telemetryService, themeService, storageService);
	}

	protected createEditor(parent: HTMLElement): void {
		this.container = document.createElement('div');
		this.container.style.width = '100%';
		this.container.style.height = '100%';
		this.container.style.overflow = 'hidden';
		parent.appendChild(this.container);
	}

	override async setInput(input: EditorInput, options: IEditorOptions | undefined, context: unknown, token: CancellationToken): Promise<void> {
		await super.setInput(input, options, context, token);

		if (input instanceof DiagramEditorInput) {
			this.renderDiagram(input.designResult);
		}
	}

	private renderDiagram(result: HardwareDesignResult): void {
		if (this.webview) {
			this.webview.dispose();
		}

		this.webview = this.webviewService.createWebviewOverlay({
			providedViewType: 'circuitforge.diagram',
			title: 'Diagram',
			options: { retainContextWhenHidden: true },
			contentOptions: {
				allowScripts: true,
				localResourceRoots: [],
			},
		});

		this.webview.layoutWebviewOverElement(this.container);
		this.webview.claim(this, this.window, this.scopedContextKeyService);

		const svgContent = this.generateDiagramSvg(result);
		this.webview.setHtml(this.generateDiagramHtml(svgContent, result));

		this._register(this.webview.onMessage(e => {
			if (e.message?.command === 'exportSVG') {
				this.exportSVG(svgContent, result.projectTitle);
			}
		}));
	}

	private generateDiagramSvg(result: HardwareDesignResult): string {
		const renderer = new BreadboardRenderer(result.wiring);
		const shapes = new ComponentShapes();
		const router = new WireRouter(result.wiring);

		let svg = renderer.renderBoard();
		svg += renderer.renderPowerRails();

		// Render components
		for (const placement of result.wiring.components) {
			const bomEntry = result.bom.find(b => b.id === placement.componentId);
			const shapeName = bomEntry?.svgShapeId || 'generic_module';
			svg += shapes.render(shapeName, placement, bomEntry?.name || placement.componentId);
		}

		// Render wires
		for (const connection of result.wiring.connections) {
			svg += router.renderWire(connection);
		}

		const { width, height } = renderer.getBoardDimensions();
		return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"
			style="background: #2d2d2d;">${svg}</svg>`;
	}

	private generateDiagramHtml(svgContent: string, result: HardwareDesignResult): string {
		return `<!DOCTYPE html>
<html>
<head>
<style>
	* { margin: 0; padding: 0; box-sizing: border-box; }
	body {
		background: #1e1e1e;
		overflow: hidden;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	}
	.toolbar {
		position: fixed;
		top: 8px;
		right: 8px;
		z-index: 100;
		display: flex;
		gap: 6px;
	}
	.toolbar button {
		padding: 4px 10px;
		border: 1px solid #3c3c3c;
		border-radius: 4px;
		background: #2d2d2d;
		color: #ccc;
		cursor: pointer;
		font-size: 11px;
	}
	.toolbar button:hover { background: #3c3c3c; }
	.legend {
		position: fixed;
		bottom: 8px;
		left: 8px;
		z-index: 100;
		background: rgba(30,30,30,0.9);
		border: 1px solid #3c3c3c;
		border-radius: 4px;
		padding: 8px 12px;
		font-size: 10px;
		color: #ccc;
	}
	.legend-item {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 2px 0;
	}
	.legend-color {
		width: 20px;
		height: 3px;
		border-radius: 1px;
	}
	.zoom-info {
		position: fixed;
		bottom: 8px;
		right: 8px;
		z-index: 100;
		background: rgba(30,30,30,0.9);
		border: 1px solid #3c3c3c;
		border-radius: 4px;
		padding: 4px 8px;
		font-size: 10px;
		color: #888;
	}
	#canvas {
		width: 100%;
		height: 100%;
		cursor: grab;
		overflow: hidden;
		position: absolute;
		top: 0; left: 0; right: 0; bottom: 0;
	}
	#canvas.dragging { cursor: grabbing; }
	#svg-container {
		transform-origin: 0 0;
		position: absolute;
	}
	/* Hover interactions via CSS */
	svg .component-group:hover { filter: brightness(1.2); }
	svg .component-group:hover .component-body { stroke: #569cd6; stroke-width: 2; }
	svg .wire-path:hover { stroke-width: 3; filter: brightness(1.3); }
</style>
</head>
<body>
	<div class="toolbar">
		<button onclick="resetView()">Reset View</button>
		<button onclick="zoomIn()">Zoom +</button>
		<button onclick="zoomOut()">Zoom -</button>
		<button onclick="post('exportSVG')">Export SVG</button>
	</div>

	<div class="legend">
		<div style="font-weight:600; margin-bottom:4px;">${escapeH(result.projectTitle)}</div>
		<div class="legend-item"><div class="legend-color" style="background:#ff3333;"></div> Power (VCC)</div>
		<div class="legend-item"><div class="legend-color" style="background:#333333;border:1px solid #666;"></div> Ground (GND)</div>
		<div class="legend-item"><div class="legend-color" style="background:#4488ff;"></div> Digital Signal</div>
		<div class="legend-item"><div class="legend-color" style="background:#44bb44;"></div> Analog Signal</div>
		<div class="legend-item"><div class="legend-color" style="background:#ffaa00;"></div> I2C / SPI</div>
	</div>

	<div class="zoom-info" id="zoom-info">100%</div>

	<div id="canvas">
		<div id="svg-container">
			${svgContent}
		</div>
	</div>

	<script>
		const vscode = acquireVsCodeApi();
		function post(cmd) { vscode.postMessage({ command: cmd }); }
		function escapeH(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;'); }

		// Pan & Zoom
		const canvas = document.getElementById('canvas');
		const svgContainer = document.getElementById('svg-container');
		const zoomInfo = document.getElementById('zoom-info');
		let scale = 0.8, panX = 50, panY = 50;
		let isDragging = false, startX = 0, startY = 0;

		function updateTransform() {
			svgContainer.style.transform = 'translate(' + panX + 'px,' + panY + 'px) scale(' + scale + ')';
			zoomInfo.textContent = Math.round(scale * 100) + '%';
		}
		updateTransform();

		canvas.addEventListener('wheel', (e) => {
			e.preventDefault();
			const rect = canvas.getBoundingClientRect();
			const mouseX = e.clientX - rect.left;
			const mouseY = e.clientY - rect.top;
			const delta = e.deltaY > 0 ? 0.9 : 1.1;
			const newScale = Math.max(0.1, Math.min(5, scale * delta));
			panX = mouseX - (mouseX - panX) * (newScale / scale);
			panY = mouseY - (mouseY - panY) * (newScale / scale);
			scale = newScale;
			updateTransform();
		});

		canvas.addEventListener('mousedown', (e) => {
			isDragging = true;
			startX = e.clientX - panX;
			startY = e.clientY - panY;
			canvas.classList.add('dragging');
		});

		window.addEventListener('mousemove', (e) => {
			if (!isDragging) return;
			panX = e.clientX - startX;
			panY = e.clientY - startY;
			updateTransform();
		});

		window.addEventListener('mouseup', () => {
			isDragging = false;
			canvas.classList.remove('dragging');
		});

		function resetView() { scale = 0.8; panX = 50; panY = 50; updateTransform(); }
		function zoomIn() { scale = Math.min(5, scale * 1.2); updateTransform(); }
		function zoomOut() { scale = Math.max(0.1, scale * 0.8); updateTransform(); }

		// Tooltip on hover
		document.querySelectorAll('.wire-path').forEach(wire => {
			wire.addEventListener('mouseenter', (e) => {
				const label = wire.getAttribute('data-label');
				if (label) wire.setAttribute('title', label);
			});
		});
	</script>
</body>
</html>`;
	}

	private exportSVG(svgContent: string, title: string): void {
		this.webview?.postMessage({
			command: 'download',
			filename: `${title}_diagram.svg`,
			content: svgContent,
		});
	}

	override layout(dimension: Dimension): void {
		super.layout(dimension);
		if (this.webview) {
			this.webview.layoutWebviewOverElement(this.container);
		}
	}

	override dispose(): void {
		this.webview?.dispose();
		super.dispose();
	}
}

function escapeH(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

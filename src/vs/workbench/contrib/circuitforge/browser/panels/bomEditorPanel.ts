/*---------------------------------------------------------------------------------------------
 *  CircuitForge — AI Hardware Design Studio
 *  BOM Editor Panel — webview-based editor tab for Bill of Materials.
 *--------------------------------------------------------------------------------------------*/

import { EditorPane } from '../../../../browser/parts/editor/editorPane.js';
import { ITelemetryService } from '../../../../../platform/telemetry/common/telemetry.js';
import { IThemeService } from '../../../../../platform/theme/common/themeService.js';
import { IStorageService } from '../../../../../platform/storage/common/storage.js';
import { EditorInput } from '../../../../common/editor/editorInput.js';
import { IEditorGroup } from '../../../../services/editor/common/editorGroupsService.js';
import { URI } from '../../../../../base/common/uri.js';
import { HardwareDesignResult, BOMComponent } from '../../common/types.js';
import { CIRCUITFORGE_BOM_EDITOR_ID } from '../../common/constants.js';
import { CancellationToken } from '../../../../../base/common/cancellation.js';
import { IEditorOptions } from '../../../../../platform/editor/common/editor.js';
import { Dimension } from '../../../../../base/browser/dom.js';
import { IWebviewService, IOverlayWebview } from '../../../../contrib/webview/browser/webview.js';

// ── Editor Input ─────────────────────────────────────────────────

export class BomEditorInput extends EditorInput {
	static readonly TypeID = 'workbench.input.circuitforgeBom';

	constructor(
		readonly resource: URI,
		readonly designResult: HardwareDesignResult,
	) {
		super();
	}

	override get typeId(): string { return BomEditorInput.TypeID; }
	override get editorId(): string { return CIRCUITFORGE_BOM_EDITOR_ID; }
	override getName(): string { return `BOM: ${this.designResult.projectTitle}`; }
	override getDescription(): string { return 'Bill of Materials'; }
}

// ── Editor Pane ──────────────────────────────────────────────────

export class BomEditorPane extends EditorPane {
	static readonly ID = CIRCUITFORGE_BOM_EDITOR_ID;

	private container!: HTMLElement;
	private webview: IOverlayWebview | undefined;
	private currentResult: HardwareDesignResult | undefined;

	constructor(
		group: IEditorGroup,
		@ITelemetryService telemetryService: ITelemetryService,
		@IThemeService themeService: IThemeService,
		@IStorageService storageService: IStorageService,
		@IWebviewService private readonly webviewService: IWebviewService,
	) {
		super(BomEditorPane.ID, group, telemetryService, themeService, storageService);
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

		if (input instanceof BomEditorInput) {
			this.currentResult = input.designResult;
			this.renderBOM(input.designResult);
		}
	}

	private renderBOM(result: HardwareDesignResult): void {
		if (this.webview) {
			this.webview.dispose();
		}

		this.webview = this.webviewService.createWebviewOverlay({
			providedViewType: 'circuitforge.bom',
			title: 'BOM',
			options: { retainContextWhenHidden: true },
			contentOptions: {
				allowScripts: true,
				localResourceRoots: [],
			},
		});

		this.webview.layoutWebviewOverElement(this.container);
		this.webview.claim(this, this.window, this.scopedContextKeyService);

		this.webview.setHtml(this.generateBomHtml(result));

		this._register(this.webview.onMessage(e => {
			if (e.message?.command === 'exportCSV') {
				this.exportCSV();
			} else if (e.message?.command === 'exportJSON') {
				this.exportJSON();
			}
		}));
	}

	private generateBomHtml(result: HardwareDesignResult): string {
		const totalCost = result.bom.reduce((sum, c) => sum + c.estimatedPrice * c.quantity, 0);

		const rows = result.bom.map((c, i) => `
			<tr>
				<td>${i + 1}</td>
				<td>
					<strong>${this.escapeHtml(c.name)}</strong>
					${c.datasheetUrl ? `<br><a href="${this.escapeHtml(c.datasheetUrl)}" class="link">Datasheet</a>` : ''}
					${c.supplierUrl ? ` · <a href="${this.escapeHtml(c.supplierUrl)}" class="link">Buy</a>` : ''}
				</td>
				<td>${this.escapeHtml(c.specs)}</td>
				<td class="center">${c.quantity}</td>
				<td class="right">$${(c.estimatedPrice * c.quantity).toFixed(2)}</td>
				<td>${this.escapeHtml(c.notes)}</td>
			</tr>
		`).join('');

		const warningsHtml = result.warnings.length > 0 ? `
			<div class="warnings">
				<h3>Warnings</h3>
				<ul>${result.warnings.map(w => `<li>${this.escapeHtml(w)}</li>`).join('')}</ul>
			</div>
		` : '';

		const codeHtml = result.codeSnippet ? `
			<div class="code-section">
				<h3>Starter Code</h3>
				<pre><code>${this.escapeHtml(result.codeSnippet)}</code></pre>
			</div>
		` : '';

		return `<!DOCTYPE html>
<html>
<head>
<style>
	body {
		font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
		font-size: 13px;
		color: #e0e0e0;
		background: #1e1e1e;
		margin: 0;
		padding: 20px;
		line-height: 1.5;
	}
	h2 {
		color: #569cd6;
		font-size: 18px;
		margin: 0 0 4px 0;
		font-weight: 600;
	}
	.subtitle {
		color: #888;
		font-size: 12px;
		margin-bottom: 16px;
	}
	.toolbar {
		display: flex;
		gap: 8px;
		margin-bottom: 16px;
	}
	.toolbar button {
		padding: 5px 12px;
		border: 1px solid #3c3c3c;
		border-radius: 4px;
		background: #2d2d2d;
		color: #cccccc;
		cursor: pointer;
		font-size: 12px;
	}
	.toolbar button:hover {
		background: #3c3c3c;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 16px;
	}
	th {
		background: #2d2d2d;
		color: #569cd6;
		padding: 8px 10px;
		text-align: left;
		font-weight: 600;
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		border-bottom: 2px solid #3c3c3c;
	}
	td {
		padding: 8px 10px;
		border-bottom: 1px solid #2d2d2d;
		vertical-align: top;
	}
	tr:hover td {
		background: #252526;
	}
	.center { text-align: center; }
	.right { text-align: right; font-variant-numeric: tabular-nums; }
	.total-row {
		background: #2d2d2d;
		padding: 12px;
		border-radius: 4px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 14px;
		font-weight: 600;
		margin-bottom: 16px;
	}
	.total-price { color: #4ec9b0; font-size: 18px; }
	.warnings {
		background: #332b00;
		border: 1px solid #665500;
		border-radius: 4px;
		padding: 12px;
		margin-bottom: 16px;
	}
	.warnings h3 { color: #ffcc00; margin: 0 0 8px 0; font-size: 13px; }
	.warnings ul { margin: 0; padding-left: 20px; }
	.warnings li { margin: 4px 0; color: #e0cc80; }
	.link { color: #569cd6; text-decoration: none; font-size: 11px; }
	.link:hover { text-decoration: underline; }
	.code-section { margin-top: 16px; }
	.code-section h3 { color: #569cd6; font-size: 13px; margin: 0 0 8px 0; }
	pre {
		background: #1a1a1a;
		border: 1px solid #3c3c3c;
		border-radius: 4px;
		padding: 12px;
		overflow-x: auto;
		font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
		font-size: 12px;
		color: #d4d4d4;
	}
</style>
</head>
<body>
	<h2>${this.escapeHtml(result.projectTitle)}</h2>
	<div class="subtitle">${this.escapeHtml(result.description)}</div>

	<div class="toolbar">
		<button onclick="post('exportCSV')">Export CSV</button>
		<button onclick="post('exportJSON')">Export JSON</button>
	</div>

	<table>
		<thead>
			<tr>
				<th>#</th>
				<th>Component</th>
				<th>Specs</th>
				<th class="center">Qty</th>
				<th class="right">Price</th>
				<th>Notes</th>
			</tr>
		</thead>
		<tbody>${rows}</tbody>
	</table>

	<div class="total-row">
		<span>Estimated Total (${result.bom.reduce((s, c) => s + c.quantity, 0)} items)</span>
		<span class="total-price">$${totalCost.toFixed(2)}</span>
	</div>

	${warningsHtml}
	${codeHtml}

	<script>
		const vscode = acquireVsCodeApi();
		function post(command) { vscode.postMessage({ command }); }
	</script>
</body>
</html>`;
	}

	private escapeHtml(str: string): string {
		return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}

	private exportCSV(): void {
		if (!this.currentResult) { return; }
		const header = '#,Component,Specs,Quantity,Unit Price,Total Price,Notes';
		const rows = this.currentResult.bom.map((c, i) =>
			`${i + 1},"${c.name}","${c.specs}",${c.quantity},${c.estimatedPrice.toFixed(2)},${(c.estimatedPrice * c.quantity).toFixed(2)},"${c.notes}"`
		);
		const csv = [header, ...rows].join('\n');
		this.downloadFile(`${this.currentResult.projectTitle}_BOM.csv`, csv, 'text/csv');
	}

	private exportJSON(): void {
		if (!this.currentResult) { return; }
		const json = JSON.stringify(this.currentResult.bom, null, 2);
		this.downloadFile(`${this.currentResult.projectTitle}_BOM.json`, json, 'application/json');
	}

	private downloadFile(filename: string, content: string, _mimeType: string): void {
		// In a webview context, we'll use the webview to trigger download
		this.webview?.postMessage({
			command: 'download',
			filename,
			content,
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

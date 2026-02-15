/*---------------------------------------------------------------------------------------------
 *  CircuitForge — AI Hardware Design Studio
 *  Project Input Pane — sidebar panel with idea textarea + Generate button.
 *--------------------------------------------------------------------------------------------*/

import { ViewPane, IViewPaneOptions } from '../../../../browser/parts/views/viewPane.js';
import { IKeybindingService } from '../../../../../platform/keybinding/common/keybinding.js';
import { IContextMenuService } from '../../../../../platform/contextview/browser/contextView.js';
import { IConfigurationService } from '../../../../../platform/configuration/common/configuration.js';
import { IContextKeyService } from '../../../../../platform/contextkey/common/contextkey.js';
import { IViewDescriptorService } from '../../../../common/views.js';
import { IInstantiationService } from '../../../../../platform/instantiation/common/instantiation.js';
import { IOpenerService } from '../../../../../platform/opener/common/opener.js';
import { IThemeService } from '../../../../../platform/theme/common/themeService.js';
import { ITelemetryService } from '../../../../../platform/telemetry/common/telemetry.js';
import { IHoverService } from '../../../../../platform/hover/browser/hover.js';
import { IEditorService } from '../../../../services/editor/common/editorService.js';
import { IHardwareAIService } from '../services/hardwareAIService.js';
import { IComponentDatabaseService } from '../services/componentDatabaseService.js';
import { BomEditorInput } from './bomEditorPanel.js';
import { DiagramEditorInput } from './diagramEditorPanel.js';
import { HardwareDesignResult } from '../../common/types.js';
import { URI } from '../../../../../base/common/uri.js';

export class ProjectInputPane extends ViewPane {

	static readonly ID = 'circuitforge.projectInput';

	private textarea!: HTMLTextAreaElement;
	private generateButton!: HTMLButtonElement;
	private spinner!: HTMLDivElement;
	private historyContainer!: HTMLDivElement;
	private bodyContainer!: HTMLElement;

	constructor(
		options: IViewPaneOptions,
		@IKeybindingService keybindingService: IKeybindingService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IConfigurationService configurationService: IConfigurationService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IViewDescriptorService viewDescriptorService: IViewDescriptorService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IOpenerService openerService: IOpenerService,
		@IThemeService themeService: IThemeService,
		@ITelemetryService telemetryService: ITelemetryService,
		@IHoverService hoverService: IHoverService,
		@IEditorService private readonly editorService: IEditorService,
		@IHardwareAIService private readonly hardwareAIService: IHardwareAIService,
		@IComponentDatabaseService private readonly componentDatabaseService: IComponentDatabaseService,
	) {
		super(options, keybindingService, contextMenuService, configurationService,
			contextKeyService, viewDescriptorService, instantiationService, openerService,
			themeService, telemetryService, hoverService);
	}

	protected override renderBody(container: HTMLElement): void {
		super.renderBody(container);
		this.bodyContainer = container;
		container.classList.add('circuitforge-input-pane');

		// Inline styles to avoid needing a separate CSS build step
		container.style.padding = '12px';
		container.style.display = 'flex';
		container.style.flexDirection = 'column';
		container.style.gap = '12px';
		container.style.fontFamily = 'var(--vscode-font-family)';

		// Logo / header
		const header = document.createElement('div');
		header.style.textAlign = 'center';
		header.style.padding = '16px 0 12px 0';
		header.style.backgroundImage = 'radial-gradient(circle, #2A3544 1px, transparent 1px)';
		header.style.backgroundSize = '16px 16px';
		header.style.backgroundPosition = 'center';

		const title = document.createElement('div');
		title.style.fontSize = '20px';
		title.style.fontWeight = '700';
		title.style.color = '#00D47E';
		title.style.fontFamily = "'JetBrains Mono', 'SF Mono', 'Cascadia Code', monospace";
		title.style.letterSpacing = '0.5px';
		title.textContent = 'CircuitForge';
		header.appendChild(title);

		const subtitle = document.createElement('div');
		subtitle.style.fontSize = '11px';
		subtitle.style.color = '#6B7B8D';
		subtitle.style.marginTop = '4px';
		subtitle.style.fontFamily = "'JetBrains Mono', 'SF Mono', 'Cascadia Code', monospace";
		subtitle.style.letterSpacing = '1px';
		subtitle.style.textTransform = 'uppercase';
		subtitle.textContent = 'AI Hardware Design Studio';
		header.appendChild(subtitle);

		container.appendChild(header);

		// Description
		const desc = document.createElement('p');
		desc.style.fontSize = '12px';
		desc.style.color = 'var(--vscode-descriptionForeground)';
		desc.style.margin = '0';
		desc.style.lineHeight = '1.4';
		desc.textContent = 'Describe your hardware project idea and CircuitForge will generate a complete Bill of Materials and interactive wiring diagram.';
		container.appendChild(desc);

		// Textarea
		this.textarea = document.createElement('textarea');
		this.textarea.placeholder = 'e.g., "Temperature monitoring system with LCD display and buzzer alarm"';
		this.textarea.rows = 5;
		this.textarea.style.width = '100%';
		this.textarea.style.resize = 'vertical';
		this.textarea.style.padding = '8px';
		this.textarea.style.borderRadius = '6px';
		this.textarea.style.border = '1px solid #2A3544';
		this.textarea.style.background = '#1A2332';
		this.textarea.style.color = '#D4DDE8';
		this.textarea.style.fontFamily = "'JetBrains Mono', 'SF Mono', 'Cascadia Code', monospace";
		this.textarea.style.fontSize = '12px';
		this.textarea.style.transition = 'border-color 0.2s ease';
		this.textarea.addEventListener('focus', () => { this.textarea.style.borderColor = '#00D47E'; });
		this.textarea.addEventListener('blur', () => { this.textarea.style.borderColor = '#2A3544'; });
		this.textarea.style.boxSizing = 'border-box';
		container.appendChild(this.textarea);

		// Generate button
		this.generateButton = document.createElement('button');
		this.generateButton.textContent = 'Generate Design';
		this.generateButton.style.width = '100%';
		this.generateButton.style.padding = '8px 16px';
		this.generateButton.style.border = 'none';
		this.generateButton.style.borderRadius = '6px';
		this.generateButton.style.background = '#00D47E';
		this.generateButton.style.color = '#0D1117';
		this.generateButton.style.cursor = 'pointer';
		this.generateButton.style.fontSize = '13px';
		this.generateButton.style.fontWeight = '600';
		this.generateButton.style.fontFamily = "'JetBrains Mono', 'SF Mono', 'Cascadia Code', monospace";
		this.generateButton.style.transition = 'background 0.2s ease';
		this.generateButton.addEventListener('click', () => this.onGenerate());
		this.generateButton.addEventListener('mouseenter', () => {
			this.generateButton.style.background = '#00F08E';
		});
		this.generateButton.addEventListener('mouseleave', () => {
			this.generateButton.style.background = '#00D47E';
		});
		container.appendChild(this.generateButton);

		// Spinner (hidden by default)
		this.spinner = document.createElement('div');
		this.spinner.style.display = 'none';
		this.spinner.style.textAlign = 'center';
		this.spinner.style.padding = '12px';

		const spinnerCircle = document.createElement('div');
		spinnerCircle.style.display = 'inline-block';
		spinnerCircle.style.width = '20px';
		spinnerCircle.style.height = '20px';
		spinnerCircle.style.border = '2px solid #2A3544';
		spinnerCircle.style.borderTopColor = '#00D47E';
		spinnerCircle.style.borderRadius = '50%';
		spinnerCircle.style.animation = 'cf-spin 0.8s linear infinite';
		this.spinner.appendChild(spinnerCircle);

		const spinnerText = document.createElement('div');
		spinnerText.style.marginTop = '8px';
		spinnerText.style.fontSize = '12px';
		spinnerText.style.color = 'var(--vscode-descriptionForeground)';
		spinnerText.textContent = 'Generating hardware design...';
		this.spinner.appendChild(spinnerText);

		// Inject keyframes via a style element
		const style = document.createElement('style');
		style.textContent = '@keyframes cf-spin { to { transform: rotate(360deg); } }';
		this.spinner.appendChild(style);

		container.appendChild(this.spinner);

		// Quick examples
		const examplesLabel = document.createElement('div');
		examplesLabel.style.fontSize = '10px';
		examplesLabel.style.fontWeight = '600';
		examplesLabel.style.color = '#6B7B8D';
		examplesLabel.style.marginTop = '4px';
		examplesLabel.style.textTransform = 'uppercase';
		examplesLabel.style.letterSpacing = '1px';
		examplesLabel.textContent = 'Quick Examples';
		container.appendChild(examplesLabel);

		const examples = [
			'LED blink with Arduino',
			'Temperature monitor with LCD',
			'Servo controlled by potentiometer',
			'Ultrasonic distance sensor with OLED display',
			'Robot car with obstacle avoidance',
		];

		for (const example of examples) {
			const btn = document.createElement('button');
			btn.textContent = example;
			btn.style.display = 'block';
			btn.style.width = '100%';
			btn.style.padding = '6px 8px';
			btn.style.margin = '4px 0';
			btn.style.border = '1px solid #2A3544';
			btn.style.borderRadius = '6px';
			btn.style.background = 'transparent';
			btn.style.color = '#C78432';
			btn.style.cursor = 'pointer';
			btn.style.fontSize = '11px';
			btn.style.textAlign = 'left';
			btn.style.transition = 'background 0.15s ease, border-color 0.15s ease';
			btn.addEventListener('click', () => {
				this.textarea.value = example;
				this.textarea.focus();
			});
			btn.addEventListener('mouseenter', () => {
				btn.style.background = '#1A2332';
				btn.style.borderColor = '#C78432';
			});
			btn.addEventListener('mouseleave', () => {
				btn.style.background = 'transparent';
				btn.style.borderColor = '#2A3544';
			});
			container.appendChild(btn);
		}

		// History section
		const historyLabel = document.createElement('div');
		historyLabel.style.fontSize = '10px';
		historyLabel.style.fontWeight = '600';
		historyLabel.style.color = '#6B7B8D';
		historyLabel.style.marginTop = '12px';
		historyLabel.style.textTransform = 'uppercase';
		historyLabel.style.letterSpacing = '1px';
		historyLabel.textContent = 'Recent Designs';
		container.appendChild(historyLabel);

		this.historyContainer = document.createElement('div');
		this.historyContainer.style.fontSize = '11px';
		this.historyContainer.style.color = '#6B7B8D';
		this.historyContainer.textContent = 'No designs yet. Generate your first project!';
		container.appendChild(this.historyContainer);

		// Handle keyboard shortcut
		this.textarea.addEventListener('keydown', (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
				this.onGenerate();
			}
		});
	}

	private async onGenerate(): Promise<void> {
		const idea = this.textarea.value.trim();
		if (!idea) {
			console.warn('[CircuitForge][Input] Generate clicked with empty idea, ignoring');
			return;
		}

		console.log(`[CircuitForge][Input] Starting generation for: "${idea}"`);
		this.setLoading(true);

		try {
			console.log('[CircuitForge][Input] Calling AI service...');
			const result = await this.hardwareAIService.generateFromIdea(idea);
			console.log(`[CircuitForge][Input] AI returned: "${result.projectTitle}" — ${result.bom.length} BOM items, ${result.wiring.components.length} placements, ${result.wiring.connections.length} wires`);

			// Enrich BOM with database data
			console.log('[CircuitForge][Input] Enriching BOM with component database...');
			result.bom = this.componentDatabaseService.enrichBOM(result.bom);

			// Validate connections
			console.log('[CircuitForge][Input] Validating connections...');
			const validationWarnings = this.componentDatabaseService.validateConnections(result.wiring, result.bom);
			result.warnings = [...result.warnings, ...validationWarnings];
			if (result.warnings.length > 0) {
				console.warn(`[CircuitForge][Input] ${result.warnings.length} warnings:`, result.warnings);
			}

			console.log('[CircuitForge][Input] Opening editor panels...');
			await this.openResultPanels(result);
			this.addToHistory(result.projectTitle);
			console.log('[CircuitForge][Input] Generation complete');
		} catch (err) {
			console.error('[CircuitForge][Input] Generation failed:', err);
		} finally {
			this.setLoading(false);
		}
	}

	private setLoading(loading: boolean): void {
		this.generateButton.style.display = loading ? 'none' : 'block';
		this.spinner.style.display = loading ? 'block' : 'none';
		this.textarea.disabled = loading;
	}

	private async openResultPanels(result: HardwareDesignResult): Promise<void> {
		const bomInput = this.instantiationService.createInstance(
			BomEditorInput,
			URI.parse(`circuitforge://bom/${encodeURIComponent(result.projectTitle)}`),
			result
		);

		const diagramInput = this.instantiationService.createInstance(
			DiagramEditorInput,
			URI.parse(`circuitforge://diagram/${encodeURIComponent(result.projectTitle)}`),
			result
		);

		// Open BOM in the active editor group
		await this.editorService.openEditor(bomInput, { pinned: true });
		// Open diagram side-by-side
		await this.editorService.openEditor(diagramInput, { pinned: true });
	}

	private addToHistory(title: string): void {
		const entry = document.createElement('div');
		entry.style.padding = '4px 0';
		entry.style.borderBottom = '1px solid #2A3544';
		entry.style.color = '#C78432';
		entry.style.cursor = 'pointer';
		entry.style.fontSize = '11px';
		entry.textContent = title;

		// Replace the "no designs yet" message
		if (this.historyContainer.children.length === 0 &&
			this.historyContainer.textContent?.includes('No designs yet')) {
			this.historyContainer.textContent = '';
		}
		this.historyContainer.insertBefore(entry, this.historyContainer.firstChild);
	}

	protected override layoutBody(height: number, width: number): void {
		super.layoutBody(height, width);
		if (this.bodyContainer) {
			this.bodyContainer.style.height = `${height}px`;
			this.bodyContainer.style.overflow = 'auto';
		}
	}
}

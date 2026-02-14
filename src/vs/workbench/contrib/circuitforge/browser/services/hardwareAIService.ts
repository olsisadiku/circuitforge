/*---------------------------------------------------------------------------------------------
 *  CircuitForge — AI Hardware Design Studio
 *  Hardware AI Service — Claude API integration with structured tool use.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from '../../../../../platform/instantiation/common/instantiation.js';
import { IConfigurationService } from '../../../../../platform/configuration/common/configuration.js';
import { INotificationService, Severity } from '../../../../../platform/notification/common/notification.js';
import { Disposable } from '../../../../../base/common/lifecycle.js';
import { Emitter, Event } from '../../../../../base/common/event.js';
import { HardwareDesignResult } from '../../common/types.js';
import {
	CIRCUITFORGE_API_KEY_CONFIG,
	CIRCUITFORGE_MODEL_CONFIG,
	DEFAULT_MODEL,
	HARDWARE_DESIGN_SYSTEM_PROMPT,
	HARDWARE_DESIGN_TOOL_DEFINITION,
	SAMPLE_DESIGN_RESULT,
} from '../../common/constants.js';

export const IHardwareAIService = createDecorator<IHardwareAIService>('hardwareAIService');

export interface IHardwareAIService {
	readonly _serviceBrand: undefined;
	readonly onDidStartGeneration: Event<void>;
	readonly onDidCompleteGeneration: Event<HardwareDesignResult>;
	readonly onDidFailGeneration: Event<string>;
	readonly isGenerating: boolean;
	generateFromIdea(idea: string): Promise<HardwareDesignResult>;
}

export class HardwareAIService extends Disposable implements IHardwareAIService {
	declare readonly _serviceBrand: undefined;

	private _isGenerating = false;
	get isGenerating(): boolean { return this._isGenerating; }

	private readonly _onDidStartGeneration = this._register(new Emitter<void>());
	readonly onDidStartGeneration: Event<void> = this._onDidStartGeneration.event;

	private readonly _onDidCompleteGeneration = this._register(new Emitter<HardwareDesignResult>());
	readonly onDidCompleteGeneration: Event<HardwareDesignResult> = this._onDidCompleteGeneration.event;

	private readonly _onDidFailGeneration = this._register(new Emitter<string>());
	readonly onDidFailGeneration: Event<string> = this._onDidFailGeneration.event;

	constructor(
		@IConfigurationService private readonly configurationService: IConfigurationService,
		@INotificationService private readonly notificationService: INotificationService,
	) {
		super();
	}

	async generateFromIdea(idea: string): Promise<HardwareDesignResult> {
		const apiKey = this.configurationService.getValue<string>(CIRCUITFORGE_API_KEY_CONFIG);

		if (!apiKey) {
			this.notificationService.notify({
				severity: Severity.Error,
				message: 'CircuitForge: Please configure your Claude API key in Settings (circuitforge.claudeApiKey) to generate hardware designs.',
			});
			// Fall back to sample data for development/demo
			return this.generateWithSampleData(idea);
		}

		this._isGenerating = true;
		this._onDidStartGeneration.fire();

		try {
			const result = await this.callClaudeAPI(apiKey, idea);
			this._onDidCompleteGeneration.fire(result);
			return result;
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unknown error occurred';
			this._onDidFailGeneration.fire(message);
			this.notificationService.notify({
				severity: Severity.Error,
				message: `CircuitForge: Generation failed — ${message}`,
			});
			throw err;
		} finally {
			this._isGenerating = false;
		}
	}

	private async callClaudeAPI(apiKey: string, idea: string): Promise<HardwareDesignResult> {
		const model = this.configurationService.getValue<string>(CIRCUITFORGE_MODEL_CONFIG) || DEFAULT_MODEL;

		const requestBody = {
			model,
			max_tokens: 8192,
			system: HARDWARE_DESIGN_SYSTEM_PROMPT,
			tools: [HARDWARE_DESIGN_TOOL_DEFINITION],
			tool_choice: { type: 'tool', name: 'generate_hardware_design' },
			messages: [
				{
					role: 'user',
					content: `Design a complete hardware project for: "${idea}"\n\nProvide a full bill of materials and breadboard wiring diagram. Use common Arduino/ESP32 components. Include ALL necessary passive components (resistors, capacitors, etc.).`
				}
			]
		};

		const response = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': apiKey,
				'anthropic-version': '2023-06-01',
			},
			body: JSON.stringify(requestBody),
		});

		if (!response.ok) {
			const errorBody = await response.text();
			if (response.status === 401) {
				throw new Error('Invalid API key. Please check your CircuitForge API key in Settings.');
			}
			if (response.status === 429) {
				throw new Error('Rate limit exceeded. Please wait a moment and try again.');
			}
			throw new Error(`API request failed (${response.status}): ${errorBody}`);
		}

		const data = await response.json();

		// Extract the tool use result from Claude's response
		const toolUseBlock = data.content?.find((block: { type: string }) => block.type === 'tool_use');
		if (!toolUseBlock || toolUseBlock.name !== 'generate_hardware_design') {
			throw new Error('Unexpected API response format — no tool use block found.');
		}

		const designInput = toolUseBlock.input;
		return this.parseDesignResult(designInput);
	}

	private parseDesignResult(input: Record<string, unknown>): HardwareDesignResult {
		return {
			projectTitle: (input.projectTitle as string) || 'Untitled Project',
			description: (input.description as string) || '',
			bom: (input.bom as HardwareDesignResult['bom']) || [],
			wiring: (input.wiring as HardwareDesignResult['wiring']) || {
				components: [],
				connections: [],
				powerRails: { topPositive: '5V', topGround: 'GND', bottomPositive: '5V', bottomGround: 'GND' },
				boardRows: 63,
				boardCols: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
			},
			warnings: (input.warnings as string[]) || [],
			codeSnippet: (input.codeSnippet as string) || undefined,
		};
	}

	private generateWithSampleData(_idea: string): HardwareDesignResult {
		this._isGenerating = true;
		this._onDidStartGeneration.fire();

		// Return sample data after a brief simulated delay
		const result = { ...SAMPLE_DESIGN_RESULT };
		this._onDidCompleteGeneration.fire(result);
		this._isGenerating = false;
		return result;
	}
}

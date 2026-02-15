/*---------------------------------------------------------------------------------------------
 *  CircuitForge — AI Hardware Design Studio
 *  Hardware AI Service — OpenAI API integration with function calling.
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
			console.warn('[CircuitForge][AI] No API key configured, falling back to sample data');
			this.notificationService.notify({
				severity: Severity.Error,
				message: 'CircuitForge: Please configure your OpenAI API key in Settings (circuitforge.openaiApiKey) to generate hardware designs.',
			});
			// Fall back to sample data for development/demo
			return this.generateWithSampleData(idea);
		}

		console.log(`[CircuitForge][AI] API key found (${apiKey.slice(0, 8)}...), starting generation`);
		this._isGenerating = true;
		this._onDidStartGeneration.fire();

		try {
			const result = await this.callOpenAIAPI(apiKey, idea);
			console.log('[CircuitForge][AI] API call succeeded:', {
				title: result.projectTitle,
				bomCount: result.bom.length,
				componentCount: result.wiring.components.length,
				connectionCount: result.wiring.connections.length,
				warnings: result.warnings.length,
			});
			this._onDidCompleteGeneration.fire(result);
			return result;
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unknown error occurred';
			console.error('[CircuitForge][AI] Generation failed:', message, err);
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

	private async callOpenAIAPI(apiKey: string, idea: string): Promise<HardwareDesignResult> {
		const model = this.configurationService.getValue<string>(CIRCUITFORGE_MODEL_CONFIG) || DEFAULT_MODEL;
		console.log(`[CircuitForge][AI] Calling OpenAI API — model: ${model}`);

		const requestBody = {
			model,
			max_tokens: 8192,
			messages: [
				{
					role: 'system',
					content: HARDWARE_DESIGN_SYSTEM_PROMPT
				},
				{
					role: 'user',
					content: `Design a complete hardware project for: "${idea}"\n\nProvide a full bill of materials and breadboard wiring diagram. Use common Arduino/ESP32 components. Include ALL necessary passive components (resistors, capacitors, etc.).`
				}
			],
			tools: [HARDWARE_DESIGN_TOOL_DEFINITION],
			tool_choice: { type: 'function' as const, function: { name: 'generate_hardware_design' } },
		};

		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`,
			},
			body: JSON.stringify(requestBody),
		});

		console.log(`[CircuitForge][AI] API response status: ${response.status}`);

		if (!response.ok) {
			const errorBody = await response.text();
			console.error(`[CircuitForge][AI] API error body:`, errorBody);
			if (response.status === 401) {
				throw new Error('Invalid API key. Please check your OpenAI API key in Settings.');
			}
			if (response.status === 429) {
				throw new Error('Rate limit exceeded. Please wait a moment and try again.');
			}
			throw new Error(`API request failed (${response.status}): ${errorBody}`);
		}

		const data = await response.json();
		console.log(`[CircuitForge][AI] API response received — usage: ${JSON.stringify(data.usage || {})}`);

		// Extract the function call from OpenAI's response
		const message = data.choices?.[0]?.message;
		const toolCall = message?.tool_calls?.[0];
		if (!toolCall || toolCall.function?.name !== 'generate_hardware_design') {
			console.error('[CircuitForge][AI] Unexpected response — no function call found. Message:', JSON.stringify(message).slice(0, 500));
			throw new Error('Unexpected API response format — no function call found.');
		}

		console.log(`[CircuitForge][AI] Parsing function call arguments (${toolCall.function.arguments.length} chars)`);
		try {
			const designInput = JSON.parse(toolCall.function.arguments);
			return this.parseDesignResult(designInput);
		} catch (parseErr) {
			console.error('[CircuitForge][AI] Failed to parse function arguments:', parseErr);
			console.error('[CircuitForge][AI] Raw arguments:', toolCall.function.arguments.slice(0, 1000));
			throw new Error(`Failed to parse AI response: ${parseErr instanceof Error ? parseErr.message : parseErr}`);
		}
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
		console.log('[CircuitForge][AI] Using sample data (no API key)');
		this._isGenerating = true;
		this._onDidStartGeneration.fire();

		// Return sample data after a brief simulated delay
		const result = { ...SAMPLE_DESIGN_RESULT };
		console.log(`[CircuitForge][AI] Sample data: "${result.projectTitle}" — ${result.bom.length} BOM items, ${result.wiring.components.length} placements, ${result.wiring.connections.length} wires`);
		this._onDidCompleteGeneration.fire(result);
		this._isGenerating = false;
		return result;
	}
}

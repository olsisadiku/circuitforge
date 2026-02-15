/*---------------------------------------------------------------------------------------------
 *  CircuitForge — AI Hardware Design Studio
 *  Component Database Service — local JSON store for enrichment & validation.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from '../../../../../platform/instantiation/common/instantiation.js';
import { Disposable } from '../../../../../base/common/lifecycle.js';
import { BOMComponent, ComponentDatabaseEntry } from '../../common/types.js';
import { componentDatabase } from '../../common/data/componentDatabase.js';

export const IComponentDatabaseService = createDecorator<IComponentDatabaseService>('componentDatabaseService');

export interface IComponentDatabaseService {
	readonly _serviceBrand: undefined;
	getAll(): ComponentDatabaseEntry[];
	findById(id: string): ComponentDatabaseEntry | undefined;
	fuzzyMatch(name: string): ComponentDatabaseEntry | undefined;
	enrichBOM(bom: BOMComponent[]): BOMComponent[];
	validateConnections(wiring: import('../../common/types.js').WiringDiagram, bom: BOMComponent[]): string[];
}

export class ComponentDatabaseService extends Disposable implements IComponentDatabaseService {
	declare readonly _serviceBrand: undefined;

	private readonly components: Map<string, ComponentDatabaseEntry>;
	private readonly aliasMap: Map<string, string>;

	constructor() {
		super();
		this.components = new Map();
		this.aliasMap = new Map();
		this.loadDatabase();
	}

	private loadDatabase(): void {
		for (const entry of componentDatabase) {
			this.components.set(entry.id, entry);
			for (const alias of entry.aliases) {
				this.aliasMap.set(alias.toLowerCase(), entry.id);
			}
			this.aliasMap.set(entry.name.toLowerCase(), entry.id);
		}
		console.log(`[CircuitForge][DB] Loaded ${this.components.size} components, ${this.aliasMap.size} aliases`);
	}

	getAll(): ComponentDatabaseEntry[] {
		return Array.from(this.components.values());
	}

	findById(id: string): ComponentDatabaseEntry | undefined {
		return this.components.get(id);
	}

	fuzzyMatch(name: string): ComponentDatabaseEntry | undefined {
		const lower = name.toLowerCase().trim();

		// Exact alias match
		const aliasId = this.aliasMap.get(lower);
		if (aliasId) {
			return this.components.get(aliasId);
		}

		// Substring match
		for (const [alias, id] of this.aliasMap) {
			if (lower.includes(alias) || alias.includes(lower)) {
				return this.components.get(id);
			}
		}

		// Word overlap scoring
		const words = lower.split(/[\s\-_]+/);
		let bestMatch: ComponentDatabaseEntry | undefined;
		let bestScore = 0;

		for (const entry of this.components.values()) {
			const entryWords = entry.name.toLowerCase().split(/[\s\-_]+/);
			let score = 0;
			for (const word of words) {
				if (entryWords.some(ew => ew.includes(word) || word.includes(ew))) {
					score++;
				}
			}
			if (score > bestScore) {
				bestScore = score;
				bestMatch = entry;
			}
		}

		return bestScore > 0 ? bestMatch : undefined;
	}

	enrichBOM(bom: BOMComponent[]): BOMComponent[] {
		return bom.map(component => {
			const dbEntry = this.findById(component.id) || this.fuzzyMatch(component.name);
			if (!dbEntry) {
				console.warn(`[CircuitForge][DB] No database match for BOM component: id="${component.id}", name="${component.name}"`);
				return component;
			}

			console.log(`[CircuitForge][DB] Enriched "${component.name}" → shape: ${dbEntry.svgShapeId}, price: $${dbEntry.estimatedPrice}`);
			return {
				...component,
				datasheetUrl: component.datasheetUrl || dbEntry.datasheetUrl,
				supplierUrl: component.supplierUrl || dbEntry.supplierUrl,
				svgShapeId: component.svgShapeId || dbEntry.svgShapeId,
				estimatedPrice: component.estimatedPrice || dbEntry.estimatedPrice,
			};
		});
	}

	validateConnections(wiring: import('../../common/types.js').WiringDiagram, bom: BOMComponent[]): string[] {
		const warnings: string[] = [];
		const componentMap = new Map(bom.map(c => [c.id, c]));

		for (const connection of wiring.connections) {
			const fromComponent = componentMap.get(connection.from.componentId);
			const toComponent = componentMap.get(connection.to.componentId);

			if (!fromComponent) {
				warnings.push(`Wire "${connection.id}": source component "${connection.from.componentId}" not found in BOM.`);
			}
			if (!toComponent) {
				warnings.push(`Wire "${connection.id}": target component "${connection.to.componentId}" not found in BOM.`);
			}

			// Validate pin names against database entries
			if (fromComponent) {
				const dbEntry = this.findById(fromComponent.id) || this.fuzzyMatch(fromComponent.name);
				if (dbEntry && dbEntry.pins.length > 0) {
					const pinExists = dbEntry.pins.some(p => p.name === connection.from.pin);
					if (!pinExists) {
						warnings.push(`Wire "${connection.id}": pin "${connection.from.pin}" not found on "${fromComponent.name}".`);
					}
				}
			}
			if (toComponent) {
				const dbEntry = this.findById(toComponent.id) || this.fuzzyMatch(toComponent.name);
				if (dbEntry && dbEntry.pins.length > 0) {
					const pinExists = dbEntry.pins.some(p => p.name === connection.to.pin);
					if (!pinExists) {
						warnings.push(`Wire "${connection.id}": pin "${connection.to.pin}" not found on "${toComponent.name}".`);
					}
				}
			}
		}

		return warnings;
	}
}

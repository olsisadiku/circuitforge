/*---------------------------------------------------------------------------------------------
 *  CircuitForge — AI Hardware Design Studio
 *  Core type definitions shared across all CircuitForge modules.
 *--------------------------------------------------------------------------------------------*/

export interface BOMComponent {
	id: string;
	name: string;
	category: ComponentCategory;
	specs: string;
	quantity: number;
	estimatedPrice: number;
	notes: string;
	datasheetUrl?: string;
	supplierUrl?: string;
	svgShapeId?: string;
}

export type ComponentCategory =
	| 'microcontroller'
	| 'sensor'
	| 'display'
	| 'actuator'
	| 'passive'
	| 'connector'
	| 'power'
	| 'other';

export interface WireConnection {
	id: string;
	from: PinReference;
	to: PinReference;
	color: WireColor;
	signalType: SignalType;
}

export interface PinReference {
	componentId: string;
	pin: string;
}

export type WireColor = 'red' | 'black' | 'blue' | 'green' | 'yellow' | 'orange' | 'white' | 'purple' | 'gray' | 'brown';

export type SignalType = 'power' | 'ground' | 'digital' | 'analog' | 'i2c-sda' | 'i2c-scl' | 'spi-mosi' | 'spi-miso' | 'spi-clk' | 'spi-cs' | 'uart-tx' | 'uart-rx' | 'pwm' | 'other';

export interface BreadboardPlacement {
	componentId: string;
	row: number;
	col: string;
	orientation: 'horizontal' | 'vertical';
	span: number;
}

export interface PowerRailConfig {
	topPositive: string;
	topGround: string;
	bottomPositive: string;
	bottomGround: string;
}

export interface WiringDiagram {
	components: BreadboardPlacement[];
	connections: WireConnection[];
	powerRails: PowerRailConfig;
	boardRows: number;
	boardCols: string[];
}

export interface HardwareDesignResult {
	projectTitle: string;
	description: string;
	bom: BOMComponent[];
	wiring: WiringDiagram;
	warnings: string[];
	codeSnippet?: string;
}

export interface ComponentDatabaseEntry {
	id: string;
	name: string;
	aliases: string[];
	category: ComponentCategory;
	specs: string;
	pins: PinDefinition[];
	breadboardSpan: number;
	orientation: 'horizontal' | 'vertical';
	estimatedPrice: number;
	supplierUrl?: string;
	datasheetUrl?: string;
	svgShapeId: string;
}

export interface PinDefinition {
	name: string;
	type: 'power' | 'ground' | 'digital' | 'analog' | 'i2c' | 'spi' | 'uart' | 'pwm' | 'other';
	position: 'left' | 'right' | 'top' | 'bottom';
	index: number;
}

export interface CircuitForgeProject {
	id: string;
	title: string;
	idea: string;
	result: HardwareDesignResult | null;
	createdAt: number;
	updatedAt: number;
}

/*---------------------------------------------------------------------------------------------
 *  CircuitForge — AI Hardware Design Studio
 *  Constants, IDs, and default values.
 *--------------------------------------------------------------------------------------------*/

// View IDs
export const CIRCUITFORGE_VIEW_CONTAINER_ID = 'workbench.view.circuitforge';
export const CIRCUITFORGE_PROJECT_INPUT_VIEW_ID = 'circuitforge.projectInput';

// Editor IDs
export const CIRCUITFORGE_BOM_EDITOR_ID = 'workbench.editor.circuitforgeBom';
export const CIRCUITFORGE_DIAGRAM_EDITOR_ID = 'workbench.editor.circuitforgeDiagram';

// Command IDs
export const CIRCUITFORGE_NEW_PROJECT_COMMAND_ID = 'circuitforge.newProject';
export const CIRCUITFORGE_GENERATE_COMMAND_ID = 'circuitforge.generate';
export const CIRCUITFORGE_EXPORT_BOM_CSV_COMMAND_ID = 'circuitforge.exportBomCsv';
export const CIRCUITFORGE_EXPORT_BOM_JSON_COMMAND_ID = 'circuitforge.exportBomJson';
export const CIRCUITFORGE_EXPORT_DIAGRAM_SVG_COMMAND_ID = 'circuitforge.exportDiagramSvg';

// Configuration keys
export const CIRCUITFORGE_CONFIG_SECTION = 'circuitforge';
export const CIRCUITFORGE_API_KEY_CONFIG = 'circuitforge.openaiApiKey';
export const CIRCUITFORGE_MODEL_CONFIG = 'circuitforge.model';

// Defaults
export const DEFAULT_MODEL = 'gpt-4o';
export const BREADBOARD_ROWS = 63;
export const BREADBOARD_COLS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

// System prompt for OpenAI API
export const HARDWARE_DESIGN_SYSTEM_PROMPT = `You are an expert hardware engineer specializing in Arduino and ESP32 microcontroller projects. When designing a hardware project:

1. COMPONENTS: Use common, widely-available components. Always include ALL necessary passive components:
   - Pull-up/pull-down resistors for I2C, buttons, and open-drain outputs
   - Current-limiting resistors for LEDs (220Ω typical)
   - Decoupling capacitors (100nF) near ICs and sensors
   - Bypass capacitors for power stability

2. WIRING: Use standard wire colors:
   - RED = VCC/power (5V or 3.3V)
   - BLACK = GND/ground
   - Other colors for signals (BLUE, GREEN, YELLOW, ORANGE, WHITE, PURPLE)

3. BREADBOARD LAYOUT: Use a standard 63-row solderless breadboard:
   - Columns a-e on the left side, f-j on the right side
   - Center gap between columns e and f
   - Top and bottom power rails (+ and -)
   - Place components to minimize wire crossings
   - Microcontrollers should span the center gap

4. SAFETY: Include warnings for:
   - Voltage level mismatches (5V vs 3.3V logic)
   - Current limits on GPIO pins
   - Power supply requirements
   - Components that need external power (motors, servos)

5. PRICING: Provide realistic estimated prices in USD for individual components from common retailers.`;

// Tool definition for OpenAI function calling
export const HARDWARE_DESIGN_TOOL_DEFINITION = {
	type: 'function' as const,
	function: {
		name: 'generate_hardware_design',
		description: 'Generate a complete hardware design with bill of materials and wiring diagram for a breadboard-based Arduino/ESP32 project.',
		parameters: {
		type: 'object' as const,
		properties: {
			projectTitle: {
				type: 'string',
				description: 'A descriptive title for the hardware project'
			},
			description: {
				type: 'string',
				description: 'Brief description of what the project does'
			},
			bom: {
				type: 'array',
				description: 'Bill of materials - all components needed',
				items: {
					type: 'object',
					properties: {
						id: { type: 'string', description: 'Unique component ID (e.g., "arduino_uno", "led_1", "r_220_1")' },
						name: { type: 'string', description: 'Human-readable component name' },
						category: { type: 'string', enum: ['microcontroller', 'sensor', 'display', 'actuator', 'passive', 'connector', 'power', 'other'] },
						specs: { type: 'string', description: 'Key specifications (e.g., "220Ω 1/4W", "5mm Red")' },
						quantity: { type: 'number' },
						estimatedPrice: { type: 'number', description: 'Estimated price in USD' },
						notes: { type: 'string', description: 'Usage notes or warnings' }
					},
					required: ['id', 'name', 'category', 'specs', 'quantity', 'estimatedPrice', 'notes']
				}
			},
			wiring: {
				type: 'object',
				description: 'Complete wiring diagram specification',
				properties: {
					components: {
						type: 'array',
						description: 'Component placements on the breadboard',
						items: {
							type: 'object',
							properties: {
								componentId: { type: 'string' },
								row: { type: 'number', description: 'Starting row (1-63)' },
								col: { type: 'string', description: 'Starting column (a-j)' },
								orientation: { type: 'string', enum: ['horizontal', 'vertical'] },
								span: { type: 'number', description: 'How many rows/cols the component spans' }
							},
							required: ['componentId', 'row', 'col', 'orientation', 'span']
						}
					},
					connections: {
						type: 'array',
						description: 'Wire connections between components',
						items: {
							type: 'object',
							properties: {
								id: { type: 'string' },
								from: {
									type: 'object',
									properties: {
										componentId: { type: 'string' },
										pin: { type: 'string' }
									},
									required: ['componentId', 'pin']
								},
								to: {
									type: 'object',
									properties: {
										componentId: { type: 'string' },
										pin: { type: 'string' }
									},
									required: ['componentId', 'pin']
								},
								color: { type: 'string', enum: ['red', 'black', 'blue', 'green', 'yellow', 'orange', 'white', 'purple', 'gray', 'brown'] },
								signalType: { type: 'string', enum: ['power', 'ground', 'digital', 'analog', 'i2c-sda', 'i2c-scl', 'spi-mosi', 'spi-miso', 'spi-clk', 'spi-cs', 'uart-tx', 'uart-rx', 'pwm', 'other'] }
							},
							required: ['id', 'from', 'to', 'color', 'signalType']
						}
					},
					powerRails: {
						type: 'object',
						properties: {
							topPositive: { type: 'string', description: 'Voltage on top positive rail (e.g., "5V")' },
							topGround: { type: 'string', description: 'Top ground rail label' },
							bottomPositive: { type: 'string', description: 'Voltage on bottom positive rail' },
							bottomGround: { type: 'string', description: 'Bottom ground rail label' }
						},
						required: ['topPositive', 'topGround', 'bottomPositive', 'bottomGround']
					},
					boardRows: { type: 'number', description: 'Number of rows on the breadboard (typically 63)' },
					boardCols: {
						type: 'array',
						items: { type: 'string' },
						description: 'Column labels (typically a-j)'
					}
				},
				required: ['components', 'connections', 'powerRails', 'boardRows', 'boardCols']
			},
			warnings: {
				type: 'array',
				items: { type: 'string' },
				description: 'Safety warnings and important notes'
			},
			codeSnippet: {
				type: 'string',
				description: 'Optional Arduino/ESP32 starter code snippet'
			}
		},
		required: ['projectTitle', 'description', 'bom', 'wiring', 'warnings']
		}
	}
};

// Sample data for testing without API
export const SAMPLE_DESIGN_RESULT: import('./types.js').HardwareDesignResult = {
	projectTitle: 'LED Blink with Arduino',
	description: 'A simple project that blinks an LED connected to Arduino pin 13 through a current-limiting resistor.',
	bom: [
		{ id: 'arduino_uno', name: 'Arduino Uno R3', category: 'microcontroller', specs: 'ATmega328P, 5V, 16MHz', quantity: 1, estimatedPrice: 12.00, notes: 'Main microcontroller board' },
		{ id: 'led_1', name: 'Red LED', category: 'passive', specs: '5mm, Red, 2V forward voltage', quantity: 1, estimatedPrice: 0.10, notes: 'Standard through-hole LED' },
		{ id: 'r_220_1', name: '220Ω Resistor', category: 'passive', specs: '220Ω, 1/4W, 5% tolerance', quantity: 1, estimatedPrice: 0.05, notes: 'Current-limiting resistor for LED' },
		{ id: 'breadboard_1', name: 'Solderless Breadboard', category: 'other', specs: '830 tie points, full size', quantity: 1, estimatedPrice: 5.00, notes: 'Standard prototyping breadboard' },
		{ id: 'jumper_wires', name: 'Jumper Wire Kit', category: 'connector', specs: 'Male-to-male, assorted colors', quantity: 1, estimatedPrice: 4.00, notes: 'For making connections' },
		{ id: 'usb_cable', name: 'USB Type-B Cable', category: 'connector', specs: 'USB-A to USB-B', quantity: 1, estimatedPrice: 3.00, notes: 'For programming and power' }
	],
	wiring: {
		components: [
			{ componentId: 'arduino_uno', row: 1, col: 'a', orientation: 'vertical', span: 30 },
			{ componentId: 'led_1', row: 40, col: 'e', orientation: 'vertical', span: 2 },
			{ componentId: 'r_220_1', row: 40, col: 'f', orientation: 'horizontal', span: 4 }
		],
		connections: [
			{ id: 'w1', from: { componentId: 'arduino_uno', pin: 'D13' }, to: { componentId: 'r_220_1', pin: 'leg1' }, color: 'green', signalType: 'digital' },
			{ id: 'w2', from: { componentId: 'r_220_1', pin: 'leg2' }, to: { componentId: 'led_1', pin: 'anode' }, color: 'green', signalType: 'digital' },
			{ id: 'w3', from: { componentId: 'led_1', pin: 'cathode' }, to: { componentId: 'arduino_uno', pin: 'GND' }, color: 'black', signalType: 'ground' }
		],
		powerRails: {
			topPositive: '5V',
			topGround: 'GND',
			bottomPositive: '5V',
			bottomGround: 'GND'
		},
		boardRows: 63,
		boardCols: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
	},
	warnings: [
		'Always connect the resistor in series with the LED to prevent burnout.',
		'The Arduino Uno provides 5V from the USB connection. Do not exceed 40mA per GPIO pin.'
	],
	codeSnippet: `void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}`
};

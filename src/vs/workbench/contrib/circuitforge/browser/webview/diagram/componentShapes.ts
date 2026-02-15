/*---------------------------------------------------------------------------------------------
 *  CircuitForge — AI Hardware Design Studio
 *  Component Shapes — SVG drawing functions for each component type.
 *--------------------------------------------------------------------------------------------*/

import { BreadboardPlacement } from '../../../common/types.js';
import { BreadboardRenderer } from './breadboardRenderer.js';

type ShapeRenderer = (placement: BreadboardPlacement, label: string) => string;

export class ComponentShapes {

	private readonly shapes = new Map<string, ShapeRenderer>();

	constructor() {
		this.registerBuiltinShapes();
	}

	render(shapeId: string, placement: BreadboardPlacement, label: string): string {
		const renderer = this.shapes.get(shapeId);
		if (!renderer) {
			console.warn(`[CircuitForge][Shapes] Unknown shape "${shapeId}" for "${placement.componentId}", falling back to generic_module`);
		}
		const actualRenderer = renderer || this.shapes.get('generic_module')!;
		return `<g class="component-group" data-component="${placement.componentId}">
			${actualRenderer(placement, label)}
		</g>`;
	}

	private registerBuiltinShapes(): void {
		this.shapes.set('arduino_uno', this.renderArduinoUno.bind(this));
		this.shapes.set('arduino_nano', this.renderArduinoNano.bind(this));
		this.shapes.set('arduino_mega', this.renderArduinoMega.bind(this));
		this.shapes.set('esp32_devkit', this.renderESP32.bind(this));
		this.shapes.set('esp8266_nodemcu', this.renderESP8266.bind(this));
		this.shapes.set('led', this.renderLED.bind(this));
		this.shapes.set('resistor', this.renderResistor.bind(this));
		this.shapes.set('capacitor', this.renderCapacitor.bind(this));
		this.shapes.set('pushbutton', this.renderPushButton.bind(this));
		this.shapes.set('potentiometer', this.renderPotentiometer.bind(this));
		this.shapes.set('servo', this.renderServo.bind(this));
		this.shapes.set('dc_motor', this.renderDCMotor.bind(this));
		this.shapes.set('buzzer', this.renderBuzzer.bind(this));
		this.shapes.set('relay', this.renderRelay.bind(this));
		this.shapes.set('dht_sensor', this.renderDHTSensor.bind(this));
		this.shapes.set('hcsr04', this.renderHCSR04.bind(this));
		this.shapes.set('lcd_16x2', this.renderLCD.bind(this));
		this.shapes.set('ssd1306_oled', this.renderOLED.bind(this));
		this.shapes.set('generic_module', this.renderGenericModule.bind(this));
		this.shapes.set('generic_ic', this.renderGenericIC.bind(this));
		this.shapes.set('battery', this.renderBattery.bind(this));
	}

	private getPos(row: number, col: string) {
		return BreadboardRenderer.getHolePosition(row, col);
	}

	// ── Microcontrollers ──────────────────────────────────────────

	private renderArduinoUno(p: BreadboardPlacement, label: string): string {
		const pos = this.getPos(p.row, p.col);
		const w = 70;
		const h = p.span * 14;
		return `
			<rect class="component-body" x="${pos.x - 10}" y="${pos.y - 5}" width="${w}" height="${h}" rx="3" fill="#007A80" stroke="#005A5F" stroke-width="1.5" />
			<rect x="${pos.x - 6}" y="${pos.y}" width="22" height="10" rx="1" fill="#888" />
			<text x="${pos.x + 25}" y="${pos.y + h / 2}" text-anchor="middle" font-size="8" fill="white" font-weight="bold">${this.esc(label)}</text>
			<text x="${pos.x + 25}" y="${pos.y + h / 2 + 10}" text-anchor="middle" font-size="6" fill="#aadddd">ATmega328P</text>
		`;
	}

	private renderArduinoNano(p: BreadboardPlacement, label: string): string {
		const pos = this.getPos(p.row, p.col);
		const w = 50;
		const h = p.span * 14;
		return `
			<rect class="component-body" x="${pos.x - 5}" y="${pos.y - 5}" width="${w}" height="${h}" rx="2" fill="#007A80" stroke="#005A5F" stroke-width="1.5" />
			<rect x="${pos.x - 2}" y="${pos.y}" width="14" height="6" rx="1" fill="#888" />
			<text x="${pos.x + 20}" y="${pos.y + h / 2}" text-anchor="middle" font-size="7" fill="white" font-weight="bold">${this.esc(label)}</text>
		`;
	}

	private renderArduinoMega(p: BreadboardPlacement, label: string): string {
		const pos = this.getPos(p.row, p.col);
		const w = 80;
		const h = p.span * 14;
		return `
			<rect class="component-body" x="${pos.x - 10}" y="${pos.y - 5}" width="${w}" height="${h}" rx="3" fill="#007A80" stroke="#005A5F" stroke-width="1.5" />
			<rect x="${pos.x - 6}" y="${pos.y}" width="24" height="12" rx="1" fill="#888" />
			<text x="${pos.x + 30}" y="${pos.y + h / 2}" text-anchor="middle" font-size="8" fill="white" font-weight="bold">${this.esc(label)}</text>
		`;
	}

	private renderESP32(p: BreadboardPlacement, label: string): string {
		const pos = this.getPos(p.row, p.col);
		const w = 56;
		const h = p.span * 14;
		return `
			<rect class="component-body" x="${pos.x - 8}" y="${pos.y - 5}" width="${w}" height="${h}" rx="2" fill="#1E2040" stroke="#16213e" stroke-width="1.5" />
			<rect x="${pos.x}" y="${pos.y + 2}" width="16" height="10" rx="1" fill="#444" />
			<circle cx="${pos.x + 8}" cy="${pos.y + 7}" r="3" fill="#666" />
			<text x="${pos.x + 20}" y="${pos.y + h / 2}" text-anchor="middle" font-size="7" fill="#aabbff" font-weight="bold">${this.esc(label)}</text>
			<text x="${pos.x + 20}" y="${pos.y + h / 2 + 9}" text-anchor="middle" font-size="5" fill="#7788aa">WiFi+BT</text>
		`;
	}

	private renderESP8266(p: BreadboardPlacement, label: string): string {
		const pos = this.getPos(p.row, p.col);
		const w = 50;
		const h = p.span * 14;
		return `
			<rect class="component-body" x="${pos.x - 5}" y="${pos.y - 5}" width="${w}" height="${h}" rx="2" fill="#1E2040" stroke="#16213e" stroke-width="1.5" />
			<rect x="${pos.x}" y="${pos.y + 2}" width="12" height="8" rx="1" fill="#444" />
			<text x="${pos.x + 20}" y="${pos.y + h / 2}" text-anchor="middle" font-size="7" fill="#aabbff" font-weight="bold">${this.esc(label)}</text>
		`;
	}

	// ── Passives ──────────────────────────────────────────────────

	private renderLED(p: BreadboardPlacement, label: string): string {
		const pos = this.getPos(p.row, p.col);
		const color = label.toLowerCase().includes('green') ? '#44ff44' :
			label.toLowerCase().includes('blue') ? '#4488ff' :
				label.toLowerCase().includes('yellow') ? '#ffee00' :
					label.toLowerCase().includes('rgb') ? 'url(#rgbGradient)' : '#ff4444';
		return `
			<defs><radialGradient id="rgbGradient"><stop offset="0%" stop-color="#ff4444"/><stop offset="50%" stop-color="#44ff44"/><stop offset="100%" stop-color="#4444ff"/></radialGradient></defs>
			<circle class="component-body" cx="${pos.x}" cy="${pos.y + 7}" r="6" fill="${color}" opacity="0.8" stroke="#fff" stroke-width="0.5" />
			<circle cx="${pos.x}" cy="${pos.y + 7}" r="3" fill="white" opacity="0.4" />
			<line x1="${pos.x}" y1="${pos.y}" x2="${pos.x}" y2="${pos.y + 14}" stroke="#999" stroke-width="0.5" />
			<text x="${pos.x + 10}" y="${pos.y + 10}" font-size="6" fill="#D4DDE8">${this.esc(label)}</text>
		`;
	}

	private renderResistor(p: BreadboardPlacement, label: string): string {
		const pos = this.getPos(p.row, p.col);
		if (p.orientation === 'horizontal') {
			const len = Math.max(p.span * 14, 28);
			const bodyStart = 8;
			const bodyEnd = len - 8;
			return `
				<line x1="${pos.x}" y1="${pos.y}" x2="${pos.x + bodyStart}" y2="${pos.y}" stroke="#999" stroke-width="1" />
				<rect class="component-body" x="${pos.x + bodyStart}" y="${pos.y - 4}" width="${bodyEnd - bodyStart}" height="8" rx="2" fill="#c4a882" stroke="#8b7355" stroke-width="0.5" />
				<line x1="${pos.x + bodyStart + 4}" y1="${pos.y - 4}" x2="${pos.x + bodyStart + 4}" y2="${pos.y + 4}" stroke="#8b4513" stroke-width="2" />
				<line x1="${pos.x + bodyStart + 8}" y1="${pos.y - 4}" x2="${pos.x + bodyStart + 8}" y2="${pos.y + 4}" stroke="#333" stroke-width="2" />
				<line x1="${pos.x + bodyStart + 12}" y1="${pos.y - 4}" x2="${pos.x + bodyStart + 12}" y2="${pos.y + 4}" stroke="#ff0000" stroke-width="2" />
				<line x1="${pos.x + bodyEnd}" y1="${pos.y}" x2="${pos.x + len}" y2="${pos.y}" stroke="#999" stroke-width="1" />
				<text x="${pos.x + len / 2}" y="${pos.y - 8}" text-anchor="middle" font-size="5" fill="#D4DDE8">${this.esc(label)}</text>
			`;
		}
		// Vertical orientation
		const len = Math.max(p.span * 14, 28);
		return `
			<line x1="${pos.x}" y1="${pos.y}" x2="${pos.x}" y2="${pos.y + 8}" stroke="#999" stroke-width="1" />
			<rect class="component-body" x="${pos.x - 4}" y="${pos.y + 8}" width="8" height="${len - 16}" rx="2" fill="#c4a882" stroke="#8b7355" stroke-width="0.5" />
			<line x1="${pos.x}" y1="${pos.y + len - 8}" x2="${pos.x}" y2="${pos.y + len}" stroke="#999" stroke-width="1" />
			<text x="${pos.x + 8}" y="${pos.y + len / 2}" font-size="5" fill="#D4DDE8">${this.esc(label)}</text>
		`;
	}

	private renderCapacitor(p: BreadboardPlacement, label: string): string {
		const pos = this.getPos(p.row, p.col);
		const h = p.span * 14;
		return `
			<line x1="${pos.x}" y1="${pos.y}" x2="${pos.x}" y2="${pos.y + h / 2 - 3}" stroke="#999" stroke-width="1" />
			<line x1="${pos.x - 5}" y1="${pos.y + h / 2 - 3}" x2="${pos.x + 5}" y2="${pos.y + h / 2 - 3}" stroke="#dda0dd" stroke-width="2" />
			<path class="component-body" d="M${pos.x - 5},${pos.y + h / 2 + 3} Q${pos.x},${pos.y + h / 2 + 1} ${pos.x + 5},${pos.y + h / 2 + 3}" stroke="#dda0dd" stroke-width="2" fill="none" />
			<line x1="${pos.x}" y1="${pos.y + h / 2 + 3}" x2="${pos.x}" y2="${pos.y + h}" stroke="#999" stroke-width="1" />
			<text x="${pos.x + 8}" y="${pos.y + h / 2 + 2}" font-size="5" fill="#D4DDE8">${this.esc(label)}</text>
		`;
	}

	private renderPushButton(p: BreadboardPlacement, label: string): string {
		const pos = this.getPos(p.row, p.col);
		const w = p.orientation === 'horizontal' ? p.span * 14 : 14;
		const h = p.orientation === 'horizontal' ? 14 : p.span * 14;
		return `
			<rect class="component-body" x="${pos.x - 3}" y="${pos.y - 3}" width="${w + 6}" height="${h + 6}" rx="2" fill="#2A2A2A" stroke="#555" stroke-width="1" />
			<circle cx="${pos.x + w / 2}" cy="${pos.y + h / 2}" r="5" fill="#666" stroke="#888" stroke-width="1" />
			<circle cx="${pos.x + w / 2}" cy="${pos.y + h / 2}" r="3" fill="#888" />
			<text x="${pos.x + w / 2}" y="${pos.y - 6}" text-anchor="middle" font-size="5" fill="#D4DDE8">${this.esc(label)}</text>
		`;
	}

	private renderPotentiometer(p: BreadboardPlacement, label: string): string {
		const pos = this.getPos(p.row, p.col);
		const h = p.span * 14;
		return `
			<rect class="component-body" x="${pos.x - 8}" y="${pos.y - 3}" width="16" height="${h + 6}" rx="2" fill="#2255aa" stroke="#1144aa" stroke-width="1" />
			<circle cx="${pos.x}" cy="${pos.y + h / 2}" r="6" fill="#3366bb" stroke="#4477cc" stroke-width="1" />
			<line x1="${pos.x}" y1="${pos.y + h / 2 - 4}" x2="${pos.x}" y2="${pos.y + h / 2 + 4}" stroke="white" stroke-width="1.5" />
			<text x="${pos.x + 12}" y="${pos.y + h / 2 + 2}" font-size="5" fill="#D4DDE8">${this.esc(label)}</text>
		`;
	}

	// ── Actuators ─────────────────────────────────────────────────

	private renderServo(p: BreadboardPlacement, label: string): string {
		const pos = this.getPos(p.row, p.col);
		const h = p.span * 14;
		return `
			<rect class="component-body" x="${pos.x - 10}" y="${pos.y - 5}" width="30" height="${h + 10}" rx="3" fill="#2244aa" stroke="#1133aa" stroke-width="1" />
			<circle cx="${pos.x + 5}" cy="${pos.y + 10}" r="5" fill="#3355bb" stroke="#fff" stroke-width="0.5" />
			<rect x="${pos.x + 2}" y="${pos.y + 4}" width="6" height="2" fill="white" rx="1" />
			<text x="${pos.x + 5}" y="${pos.y + h}" text-anchor="middle" font-size="5" fill="#D4DDE8">${this.esc(label)}</text>
		`;
	}

	private renderDCMotor(p: BreadboardPlacement, label: string): string {
		const pos = this.getPos(p.row, p.col);
		return `
			<circle class="component-body" cx="${pos.x}" cy="${pos.y + 10}" r="12" fill="#555" stroke="#777" stroke-width="1" />
			<circle cx="${pos.x}" cy="${pos.y + 10}" r="3" fill="#888" />
			<text x="${pos.x}" y="${pos.y + 12}" text-anchor="middle" font-size="6" fill="white" font-weight="bold">M</text>
			<text x="${pos.x}" y="${pos.y + 28}" text-anchor="middle" font-size="5" fill="#D4DDE8">${this.esc(label)}</text>
		`;
	}

	private renderBuzzer(p: BreadboardPlacement, label: string): string {
		const pos = this.getPos(p.row, p.col);
		return `
			<circle class="component-body" cx="${pos.x}" cy="${pos.y + 10}" r="8" fill="#222" stroke="#444" stroke-width="1" />
			<circle cx="${pos.x}" cy="${pos.y + 10}" r="2" fill="#666" />
			<text x="${pos.x}" y="${pos.y + 24}" text-anchor="middle" font-size="5" fill="#D4DDE8">${this.esc(label)}</text>
		`;
	}

	private renderRelay(p: BreadboardPlacement, label: string): string {
		const pos = this.getPos(p.row, p.col);
		const h = p.span * 14;
		return `
			<rect class="component-body" x="${pos.x - 10}" y="${pos.y - 5}" width="30" height="${h + 10}" rx="2" fill="#2244aa" stroke="#1133aa" stroke-width="1" />
			<rect x="${pos.x - 6}" y="${pos.y + 5}" width="22" height="12" fill="#333" rx="1" />
			<text x="${pos.x + 5}" y="${pos.y + h}" text-anchor="middle" font-size="5" fill="#D4DDE8">${this.esc(label)}</text>
		`;
	}

	// ── Sensors ───────────────────────────────────────────────────

	private renderDHTSensor(p: BreadboardPlacement, label: string): string {
		const pos = this.getPos(p.row, p.col);
		const h = p.span * 14;
		return `
			<rect class="component-body" x="${pos.x - 8}" y="${pos.y - 5}" width="20" height="${h + 10}" rx="2" fill="#1188cc" stroke="#0066aa" stroke-width="1" />
			<rect x="${pos.x - 6}" y="${pos.y}" width="16" height="8" rx="1" fill="#0077bb" />
			<text x="${pos.x + 2}" y="${pos.y + h + 8}" text-anchor="middle" font-size="5" fill="#D4DDE8">${this.esc(label)}</text>
		`;
	}

	private renderHCSR04(p: BreadboardPlacement, label: string): string {
		const pos = this.getPos(p.row, p.col);
		const h = p.span * 14;
		return `
			<rect class="component-body" x="${pos.x - 12}" y="${pos.y - 5}" width="34" height="${h + 10}" rx="2" fill="#22aa44" stroke="#118833" stroke-width="1" />
			<circle cx="${pos.x - 2}" cy="${pos.y + 8}" r="5" fill="#44cc66" stroke="#fff" stroke-width="0.3" />
			<circle cx="${pos.x + 12}" cy="${pos.y + 8}" r="5" fill="#44cc66" stroke="#fff" stroke-width="0.3" />
			<text x="${pos.x + 5}" y="${pos.y + h + 8}" text-anchor="middle" font-size="5" fill="#D4DDE8">${this.esc(label)}</text>
		`;
	}

	// ── Displays ──────────────────────────────────────────────────

	private renderLCD(p: BreadboardPlacement, label: string): string {
		const pos = this.getPos(p.row, p.col);
		const w = p.orientation === 'horizontal' ? p.span * 14 : 30;
		const h = p.orientation === 'horizontal' ? 30 : p.span * 14;
		return `
			<rect class="component-body" x="${pos.x - 5}" y="${pos.y - 5}" width="${w + 10}" height="${h + 10}" rx="3" fill="#006633" stroke="#004422" stroke-width="1.5" />
			<rect x="${pos.x}" y="${pos.y}" width="${w}" height="${h - 6}" rx="1" fill="#88cc44" opacity="0.8" />
			<text x="${pos.x + 4}" y="${pos.y + 10}" font-size="6" fill="#003300" font-family="monospace">Hello World!</text>
			<text x="${pos.x + 4}" y="${pos.y + 18}" font-size="6" fill="#003300" font-family="monospace">CircuitForge</text>
			<text x="${pos.x + w / 2}" y="${pos.y + h + 8}" text-anchor="middle" font-size="5" fill="#D4DDE8">${this.esc(label)}</text>
		`;
	}

	private renderOLED(p: BreadboardPlacement, label: string): string {
		const pos = this.getPos(p.row, p.col);
		const h = p.span * 14;
		return `
			<rect class="component-body" x="${pos.x - 10}" y="${pos.y - 5}" width="28" height="${h + 10}" rx="2" fill="#111" stroke="#333" stroke-width="1" />
			<rect x="${pos.x - 7}" y="${pos.y}" width="22" height="18" fill="#000" rx="1" />
			<text x="${pos.x + 4}" y="${pos.y + 10}" text-anchor="middle" font-size="4" fill="#00bbff" font-family="monospace">128x64</text>
			<text x="${pos.x + 4}" y="${pos.y + h + 8}" text-anchor="middle" font-size="5" fill="#D4DDE8">${this.esc(label)}</text>
		`;
	}

	// ── Generic Shapes ───────────────────────────────────────────

	private renderGenericModule(p: BreadboardPlacement, label: string): string {
		const pos = this.getPos(p.row, p.col);
		const w = p.orientation === 'horizontal' ? p.span * 14 : 24;
		const h = p.orientation === 'horizontal' ? 24 : p.span * 14;
		return `
			<rect class="component-body" x="${pos.x - 4}" y="${pos.y - 4}" width="${w + 8}" height="${h + 8}" rx="3" fill="#1A2332" stroke="#2A3544" stroke-width="1" />
			<text x="${pos.x + w / 2}" y="${pos.y + h / 2 + 2}" text-anchor="middle" font-size="6" fill="#aabbdd" font-weight="bold">${this.esc(label)}</text>
		`;
	}

	private renderGenericIC(p: BreadboardPlacement, label: string): string {
		const pos = this.getPos(p.row, p.col);
		const h = p.span * 14;
		return `
			<rect class="component-body" x="${pos.x - 6}" y="${pos.y - 3}" width="16" height="${h + 6}" rx="1" fill="#222" stroke="#444" stroke-width="1" />
			<circle cx="${pos.x - 2}" cy="${pos.y + 2}" r="1.5" fill="#666" />
			<text x="${pos.x + 2}" y="${pos.y + h / 2 + 2}" text-anchor="middle" font-size="5" fill="#aaa">${this.esc(label)}</text>
		`;
	}

	private renderBattery(p: BreadboardPlacement, label: string): string {
		const pos = this.getPos(p.row, p.col);
		return `
			<rect class="component-body" x="${pos.x - 8}" y="${pos.y - 5}" width="20" height="35" rx="2" fill="#444" stroke="#666" stroke-width="1" />
			<rect x="${pos.x - 3}" y="${pos.y - 8}" width="10" height="3" rx="1" fill="#666" />
			<text x="${pos.x + 2}" y="${pos.y + 15}" text-anchor="middle" font-size="7" fill="#ddd" font-weight="bold">+</text>
			<text x="${pos.x + 2}" y="${pos.y + 33}" text-anchor="middle" font-size="5" fill="#D4DDE8">${this.esc(label)}</text>
		`;
	}

	private esc(s: string): string {
		return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}
}

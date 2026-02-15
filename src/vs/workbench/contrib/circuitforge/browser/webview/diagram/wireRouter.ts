/*---------------------------------------------------------------------------------------------
 *  CircuitForge — AI Hardware Design Studio
 *  Wire Router — Manhattan routing for colored wires between components.
 *--------------------------------------------------------------------------------------------*/

import { WireConnection, WiringDiagram, BreadboardPlacement } from '../../../common/types.js';
import { BreadboardRenderer } from './breadboardRenderer.js';

const WIRE_COLORS: Record<string, string> = {
	red: '#FF4444',
	black: '#555555',
	blue: '#5599FF',
	green: '#44CC55',
	yellow: '#FFDD22',
	orange: '#FF9922',
	white: '#F0F0F0',
	purple: '#BB55FF',
	gray: '#999999',
	brown: '#996644',
};

export class WireRouter {

	private readonly placements: Map<string, BreadboardPlacement>;

	constructor(wiring: WiringDiagram) {
		this.placements = new Map();
		for (const p of wiring.components) {
			this.placements.set(p.componentId, p);
		}
	}

	renderWire(connection: WireConnection): string {
		const fromPos = this.getPinPosition(connection.from.componentId, connection.from.pin);
		const toPos = this.getPinPosition(connection.to.componentId, connection.to.pin);
		const color = WIRE_COLORS[connection.color] || WIRE_COLORS.blue;
		const label = `${connection.from.componentId}.${connection.from.pin} → ${connection.to.componentId}.${connection.to.pin} (${connection.signalType})`;

		if (!fromPos || !toPos) {
			if (!fromPos) {
				console.warn(`[CircuitForge][Wires] Wire "${connection.id}": cannot resolve position for FROM "${connection.from.componentId}" (placement not found)`);
			}
			if (!toPos) {
				console.warn(`[CircuitForge][Wires] Wire "${connection.id}": cannot resolve position for TO "${connection.to.componentId}" (placement not found)`);
			}
			return '';
		}

		const path = this.computeManhattanPath(fromPos, toPos);

		return `<path
			class="wire-path"
			d="${path}"
			fill="none"
			stroke="${color}"
			stroke-width="1.8"
			stroke-linecap="round"
			stroke-linejoin="round"
			data-label="${this.esc(label)}"
			data-signal="${connection.signalType}"
			data-wire-id="${connection.id}"
			opacity="0.85"
		>
			<title>${this.esc(label)}</title>
		</path>`;
	}

	private getPinPosition(componentId: string, _pinName: string): { x: number; y: number } | null {
		const placement = this.placements.get(componentId);
		if (!placement) {
			return null;
		}

		// For now, we compute a rough pin position based on the component's placement
		// and offset by pin index. A more sophisticated approach would use the component
		// database pin definitions.
		const basePos = BreadboardRenderer.getHolePosition(placement.row, placement.col);

		// Simple heuristic: offset vertically by pin index within the component span
		const pinHash = this.hashPin(_pinName);
		const pinOffset = (pinHash % placement.span) * 14;

		return {
			x: basePos.x,
			y: basePos.y + pinOffset,
		};
	}

	private hashPin(pinName: string): number {
		// Simple deterministic hash for pin positioning
		let hash = 0;
		for (let i = 0; i < pinName.length; i++) {
			hash = ((hash << 5) - hash + pinName.charCodeAt(i)) | 0;
		}
		return Math.abs(hash);
	}

	private computeManhattanPath(from: { x: number; y: number }, to: { x: number; y: number }): string {
		const dx = to.x - from.x;
		const dy = to.y - from.y;

		// If points are close, draw a direct line
		if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
			return `M${from.x},${from.y} L${to.x},${to.y}`;
		}

		// Manhattan routing: choose L-shaped or Z-shaped path
		if (Math.abs(dx) > Math.abs(dy)) {
			// Horizontal-first L-shape
			const midX = from.x + dx / 2;
			return `M${from.x},${from.y} L${midX},${from.y} L${midX},${to.y} L${to.x},${to.y}`;
		} else {
			// Vertical-first L-shape
			const midY = from.y + dy / 2;
			return `M${from.x},${from.y} L${from.x},${midY} L${to.x},${midY} L${to.x},${to.y}`;
		}
	}

	private esc(s: string): string {
		return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}
}

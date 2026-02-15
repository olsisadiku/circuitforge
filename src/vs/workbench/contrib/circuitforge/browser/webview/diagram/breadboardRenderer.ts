/*---------------------------------------------------------------------------------------------
 *  CircuitForge — AI Hardware Design Studio
 *  Breadboard Renderer — SVG grid, holes, power rails, row/column labels.
 *--------------------------------------------------------------------------------------------*/

import { WiringDiagram } from '../../../common/types.js';

// Layout constants
const HOLE_SPACING = 14;
const HOLE_RADIUS = 2.5;
const BOARD_PADDING = 40;
const RAIL_HEIGHT = 20;
const GAP_HEIGHT = 16;
const LABEL_OFFSET = 12;

export class BreadboardRenderer {

	private readonly rows: number;
	private readonly cols: string[];
	private readonly powerRails: WiringDiagram['powerRails'];

	constructor(wiring: WiringDiagram) {
		this.rows = wiring.boardRows;
		this.cols = wiring.boardCols;
		this.powerRails = wiring.powerRails;
		console.log(`[CircuitForge][Board] Initialized: ${this.rows} rows, cols=[${this.cols.join(',')}], rails: +${this.powerRails.topPositive}/-${this.powerRails.topGround}`);
	}

	getBoardDimensions(): { width: number; height: number } {
		const colCount = this.cols.length; // 10
		const width = BOARD_PADDING * 2 + colCount * HOLE_SPACING + GAP_HEIGHT;
		const height = BOARD_PADDING * 2 + this.rows * HOLE_SPACING + RAIL_HEIGHT * 4 + GAP_HEIGHT * 2;
		return { width, height };
	}

	renderBoard(): string {
		const { width, height } = this.getBoardDimensions();
		let svg = '';

		// Board background
		svg += `<rect x="0" y="0" width="${width}" height="${height}" rx="8" fill="#F0E6D2" />`;

		// Center gap
		const leftCols = 5; // a-e
		const gapX = BOARD_PADDING + leftCols * HOLE_SPACING;
		const gapY = BOARD_PADDING + RAIL_HEIGHT * 2 + GAP_HEIGHT;
		const gapW = GAP_HEIGHT;
		const gapH = this.rows * HOLE_SPACING;
		svg += `<rect x="${gapX - 2}" y="${gapY - 2}" width="${gapW + 4}" height="${gapH + 4}" rx="2" fill="#D4C8B0" />`;

		// Render holes
		svg += this.renderHoles(gapX, gapY);

		// Row labels
		svg += this.renderRowLabels(gapY);

		// Column labels
		svg += this.renderColumnLabels(gapX, gapY);

		return svg;
	}

	private renderHoles(gapX: number, startY: number): string {
		let svg = '';

		for (let row = 0; row < this.rows; row++) {
			const y = startY + row * HOLE_SPACING;

			for (let colIdx = 0; colIdx < this.cols.length; colIdx++) {
				let x: number;
				if (colIdx < 5) {
					// Left side (a-e)
					x = BOARD_PADDING + colIdx * HOLE_SPACING;
				} else {
					// Right side (f-j) — after the gap
					x = gapX + GAP_HEIGHT + (colIdx - 5) * HOLE_SPACING;
				}

				svg += `<circle cx="${x}" cy="${y}" r="${HOLE_RADIUS}" fill="#2A2A2A" stroke="#4A4A4A" stroke-width="0.5" class="hole" data-row="${row + 1}" data-col="${this.cols[colIdx]}" />`;
			}
		}

		return svg;
	}

	private renderRowLabels(startY: number): string {
		let svg = '';

		// Label every 5th row
		for (let row = 0; row < this.rows; row += 5) {
			const y = startY + row * HOLE_SPACING;
			svg += `<text x="${BOARD_PADDING - LABEL_OFFSET}" y="${y + 4}" text-anchor="end" font-size="8" fill="#8A7A6A" font-family="monospace">${row + 1}</text>`;
		}

		return svg;
	}

	private renderColumnLabels(gapX: number, startY: number): string {
		let svg = '';
		const y = startY - 8;

		for (let colIdx = 0; colIdx < this.cols.length; colIdx++) {
			let x: number;
			if (colIdx < 5) {
				x = BOARD_PADDING + colIdx * HOLE_SPACING;
			} else {
				x = gapX + GAP_HEIGHT + (colIdx - 5) * HOLE_SPACING;
			}
			svg += `<text x="${x}" y="${y}" text-anchor="middle" font-size="8" fill="#8A7A6A" font-family="monospace">${this.cols[colIdx]}</text>`;
		}

		return svg;
	}

	renderPowerRails(): string {
		const { width } = this.getBoardDimensions();
		let svg = '';

		const railStartX = BOARD_PADDING;
		const railEndX = width - BOARD_PADDING;
		const railWidth = railEndX - railStartX;

		// Top positive rail
		const topPosY = BOARD_PADDING;
		svg += `<rect x="${railStartX}" y="${topPosY}" width="${railWidth}" height="${RAIL_HEIGHT}" rx="2" fill="#FFD4D4" stroke="#E83333" stroke-width="1" />`;
		svg += `<text x="${railStartX + 4}" y="${topPosY + 14}" font-size="9" fill="#E83333" font-weight="bold">+ ${this.powerRails.topPositive}</text>`;
		// Holes on positive rail
		for (let i = 0; i < Math.floor(railWidth / HOLE_SPACING) - 1; i++) {
			svg += `<circle cx="${railStartX + 10 + i * HOLE_SPACING}" cy="${topPosY + RAIL_HEIGHT / 2}" r="${HOLE_RADIUS}" fill="#E83333" opacity="0.4" />`;
		}

		// Top ground rail
		const topGndY = topPosY + RAIL_HEIGHT + 2;
		svg += `<rect x="${railStartX}" y="${topGndY}" width="${railWidth}" height="${RAIL_HEIGHT}" rx="2" fill="#D4D4FF" stroke="#3355DD" stroke-width="1" />`;
		svg += `<text x="${railStartX + 4}" y="${topGndY + 14}" font-size="9" fill="#3355DD" font-weight="bold">- ${this.powerRails.topGround}</text>`;
		for (let i = 0; i < Math.floor(railWidth / HOLE_SPACING) - 1; i++) {
			svg += `<circle cx="${railStartX + 10 + i * HOLE_SPACING}" cy="${topGndY + RAIL_HEIGHT / 2}" r="${HOLE_RADIUS}" fill="#3355DD" opacity="0.4" />`;
		}

		// Bottom power rails
		const boardBottom = BOARD_PADDING + RAIL_HEIGHT * 2 + GAP_HEIGHT + this.rows * HOLE_SPACING + GAP_HEIGHT;

		const botPosY = boardBottom;
		svg += `<rect x="${railStartX}" y="${botPosY}" width="${railWidth}" height="${RAIL_HEIGHT}" rx="2" fill="#FFD4D4" stroke="#E83333" stroke-width="1" />`;
		svg += `<text x="${railStartX + 4}" y="${botPosY + 14}" font-size="9" fill="#E83333" font-weight="bold">+ ${this.powerRails.bottomPositive}</text>`;
		for (let i = 0; i < Math.floor(railWidth / HOLE_SPACING) - 1; i++) {
			svg += `<circle cx="${railStartX + 10 + i * HOLE_SPACING}" cy="${botPosY + RAIL_HEIGHT / 2}" r="${HOLE_RADIUS}" fill="#E83333" opacity="0.4" />`;
		}

		const botGndY = botPosY + RAIL_HEIGHT + 2;
		svg += `<rect x="${railStartX}" y="${botGndY}" width="${railWidth}" height="${RAIL_HEIGHT}" rx="2" fill="#D4D4FF" stroke="#3355DD" stroke-width="1" />`;
		svg += `<text x="${railStartX + 4}" y="${botGndY + 14}" font-size="9" fill="#3355DD" font-weight="bold">- ${this.powerRails.bottomGround}</text>`;
		for (let i = 0; i < Math.floor(railWidth / HOLE_SPACING) - 1; i++) {
			svg += `<circle cx="${railStartX + 10 + i * HOLE_SPACING}" cy="${botGndY + RAIL_HEIGHT / 2}" r="${HOLE_RADIUS}" fill="#3355DD" opacity="0.4" />`;
		}

		return svg;
	}

	/** Convert a row/col position to absolute SVG coordinates */
	static getHolePosition(row: number, col: string): { x: number; y: number } {
		const colIndex = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].indexOf(col.toLowerCase());
		const startY = BOARD_PADDING + RAIL_HEIGHT * 2 + GAP_HEIGHT;

		let x: number;
		if (colIndex < 5) {
			x = BOARD_PADDING + colIndex * HOLE_SPACING;
		} else {
			const gapX = BOARD_PADDING + 5 * HOLE_SPACING;
			x = gapX + GAP_HEIGHT + (colIndex - 5) * HOLE_SPACING;
		}

		const y = startY + (row - 1) * HOLE_SPACING;
		return { x, y };
	}
}

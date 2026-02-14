/*---------------------------------------------------------------------------------------------
 *  CircuitForge — AI Hardware Design Studio
 *  Export Actions — commands for exporting BOM and diagrams.
 *--------------------------------------------------------------------------------------------*/

import { Action2, registerAction2 } from '../../../../../platform/actions/common/actions.js';
import { ServicesAccessor } from '../../../../../platform/instantiation/common/instantiation.js';
import { localize } from '../../../../../nls.js';
import {
	CIRCUITFORGE_EXPORT_BOM_CSV_COMMAND_ID,
	CIRCUITFORGE_EXPORT_BOM_JSON_COMMAND_ID,
	CIRCUITFORGE_EXPORT_DIAGRAM_SVG_COMMAND_ID,
} from '../../common/constants.js';
import { INotificationService, Severity } from '../../../../../platform/notification/common/notification.js';

registerAction2(class ExportBomCsvAction extends Action2 {
	constructor() {
		super({
			id: CIRCUITFORGE_EXPORT_BOM_CSV_COMMAND_ID,
			title: localize('circuitforge.exportBomCsv', 'CircuitForge: Export BOM as CSV'),
			f1: true,
		});
	}
	run(accessor: ServicesAccessor): void {
		const notificationService = accessor.get(INotificationService);
		notificationService.notify({
			severity: Severity.Info,
			message: 'Use the Export CSV button in the BOM panel to export.',
		});
	}
});

registerAction2(class ExportBomJsonAction extends Action2 {
	constructor() {
		super({
			id: CIRCUITFORGE_EXPORT_BOM_JSON_COMMAND_ID,
			title: localize('circuitforge.exportBomJson', 'CircuitForge: Export BOM as JSON'),
			f1: true,
		});
	}
	run(accessor: ServicesAccessor): void {
		const notificationService = accessor.get(INotificationService);
		notificationService.notify({
			severity: Severity.Info,
			message: 'Use the Export JSON button in the BOM panel to export.',
		});
	}
});

registerAction2(class ExportDiagramSvgAction extends Action2 {
	constructor() {
		super({
			id: CIRCUITFORGE_EXPORT_DIAGRAM_SVG_COMMAND_ID,
			title: localize('circuitforge.exportDiagramSvg', 'CircuitForge: Export Diagram as SVG'),
			f1: true,
		});
	}
	run(accessor: ServicesAccessor): void {
		const notificationService = accessor.get(INotificationService);
		notificationService.notify({
			severity: Severity.Info,
			message: 'Use the Export SVG button in the Diagram panel to export.',
		});
	}
});

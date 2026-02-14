/*---------------------------------------------------------------------------------------------
 *  CircuitForge — AI Hardware Design Studio
 *  Main contribution registration — view container, views, services, commands, editors.
 *--------------------------------------------------------------------------------------------*/

import { Registry } from '../../../../platform/registry/common/platform.js';
import { ViewContainerLocation, Extensions as ViewContainerExtensions, IViewContainersRegistry, IViewsRegistry } from '../../../common/views.js';
import { SyncDescriptor } from '../../../../platform/instantiation/common/descriptors.js';
import { ViewPaneContainer } from '../../../browser/parts/views/viewPaneContainer.js';
import { registerIcon } from '../../../../platform/theme/common/iconRegistry.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { localize, localize2 } from '../../../../nls.js';
import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';
import { EditorPaneDescriptor, IEditorPaneRegistry } from '../../../browser/editor.js';
import { EditorExtensions } from '../../../common/editor.js';
import { registerAction2, Action2 } from '../../../../platform/actions/common/actions.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { KeyMod, KeyCode } from '../../../../base/common/keyCodes.js';
import { KeybindingWeight } from '../../../../platform/keybinding/common/keybindingsRegistry.js';
import { Extensions as ConfigurationExtensions, IConfigurationRegistry, ConfigurationScope } from '../../../../platform/configuration/common/configurationRegistry.js';

import { CIRCUITFORGE_VIEW_CONTAINER_ID, CIRCUITFORGE_PROJECT_INPUT_VIEW_ID, CIRCUITFORGE_NEW_PROJECT_COMMAND_ID, CIRCUITFORGE_BOM_EDITOR_ID, CIRCUITFORGE_DIAGRAM_EDITOR_ID } from '../common/constants.js';
import { ProjectInputPane } from './panels/projectInputPane.js';
import { BomEditorPane, BomEditorInput } from './panels/bomEditorPanel.js';
import { DiagramEditorPane, DiagramEditorInput } from './panels/diagramEditorPanel.js';
import { IHardwareAIService, HardwareAIService } from './services/hardwareAIService.js';
import { IComponentDatabaseService, ComponentDatabaseService } from './services/componentDatabaseService.js';
import { IViewsService } from '../../../services/views/common/viewsService.js';

// Import export actions (self-registering)
import './actions/exportActions.js';

// ── Icon Registration ────────────────────────────────────────────

const circuitforgeViewIcon = registerIcon(
	'circuitforge-view-icon',
	Codicon.pulse,
	localize('circuitforgeViewIcon', 'CircuitForge view icon in the activity bar.')
);

// ── View Container ───────────────────────────────────────────────

const viewContainer = Registry.as<IViewContainersRegistry>(ViewContainerExtensions.ViewContainersRegistry)
	.registerViewContainer({
		id: CIRCUITFORGE_VIEW_CONTAINER_ID,
		title: localize2('circuitforge', 'CircuitForge'),
		ctorDescriptor: new SyncDescriptor(ViewPaneContainer, [CIRCUITFORGE_VIEW_CONTAINER_ID, { mergeViewWithContainerWhenSingleView: true }]),
		storageId: 'circuitforge.viewlet.state',
		icon: circuitforgeViewIcon,
		order: 10,
		hideIfEmpty: false,
	}, ViewContainerLocation.Sidebar, { doNotRegisterOpenCommand: false });

// ── Views ────────────────────────────────────────────────────────

const viewsRegistry = Registry.as<IViewsRegistry>(ViewContainerExtensions.ViewsRegistry);

viewsRegistry.registerViews([{
	id: CIRCUITFORGE_PROJECT_INPUT_VIEW_ID,
	name: localize2('circuitforgeInput', 'Project Input'),
	ctorDescriptor: new SyncDescriptor(ProjectInputPane),
	canToggleVisibility: false,
	canMoveView: false,
	containerIcon: circuitforgeViewIcon,
	order: 0,
}], viewContainer);

// ── Services ─────────────────────────────────────────────────────

registerSingleton(IHardwareAIService, HardwareAIService, InstantiationType.Delayed);
registerSingleton(IComponentDatabaseService, ComponentDatabaseService, InstantiationType.Delayed);

// ── Editor Panes ─────────────────────────────────────────────────

Registry.as<IEditorPaneRegistry>(EditorExtensions.EditorPane).registerEditorPane(
	EditorPaneDescriptor.create(
		BomEditorPane,
		CIRCUITFORGE_BOM_EDITOR_ID,
		localize('circuitforgeBom', 'CircuitForge BOM'),
	),
	[new SyncDescriptor(BomEditorInput)]
);

Registry.as<IEditorPaneRegistry>(EditorExtensions.EditorPane).registerEditorPane(
	EditorPaneDescriptor.create(
		DiagramEditorPane,
		CIRCUITFORGE_DIAGRAM_EDITOR_ID,
		localize('circuitforgeDiagram', 'CircuitForge Diagram'),
	),
	[new SyncDescriptor(DiagramEditorInput)]
);

// ── Commands ─────────────────────────────────────────────────────

registerAction2(class NewHardwareProjectAction extends Action2 {
	constructor() {
		super({
			id: CIRCUITFORGE_NEW_PROJECT_COMMAND_ID,
			title: localize2('circuitforge.newProject', 'CircuitForge: New Hardware Project'),
			f1: true,
			keybinding: {
				primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyH,
				weight: KeybindingWeight.WorkbenchContrib,
			},
		});
	}
	run(accessor: ServicesAccessor): void {
		const viewsService = accessor.get(IViewsService);
		viewsService.openView(CIRCUITFORGE_PROJECT_INPUT_VIEW_ID, true);
	}
});

// ── Configuration ────────────────────────────────────────────────

Registry.as<IConfigurationRegistry>(ConfigurationExtensions.Configuration)
	.registerConfiguration({
		id: 'circuitforge',
		order: 100,
		title: localize('circuitforgeConfig', 'CircuitForge'),
		type: 'object',
		properties: {
			'circuitforge.claudeApiKey': {
				type: 'string',
				default: '',
				markdownDescription: localize('circuitforge.claudeApiKey', 'Your Claude API key for generating hardware designs. Get one from [Anthropic Console](https://console.anthropic.com).'),
				scope: ConfigurationScope.APPLICATION,
			},
			'circuitforge.model': {
				type: 'string',
				default: 'claude-sonnet-4-5-20250929',
				enum: [
					'claude-sonnet-4-5-20250929',
					'claude-haiku-4-5-20251001',
					'claude-opus-4-6',
				],
				markdownDescription: localize('circuitforge.model', 'The Claude model to use for hardware design generation.'),
				scope: ConfigurationScope.APPLICATION,
			},
		}
	});

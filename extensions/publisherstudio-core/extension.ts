/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand(
		"publisherstudio.createProject",
		async () => {
			vscode.window.showInformationMessage("Create Book Project (stub)");
			// TODO: Scaffold book structure in workspace
		},
	);
	context.subscriptions.push(disposable);
}

export function deactivate() {}

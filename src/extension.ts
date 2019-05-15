import * as vscode from 'vscode';
import parseContainer from './parseContainer';

export class AwilixDefinitionProvider implements vscode.DefinitionProvider {
	public constructor() { }

	public async provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Definition | undefined> {
		const range = document.getWordRangeAtPosition(position);
		const symbol = document.getText(range);

		const containerFile = vscode.workspace.getConfiguration('awilix').get('containerFile');

		const container = await vscode.workspace.findFiles(`**/${containerFile}`, '', 1)
			.then(files => {
				if (document.uri.fsPath !== files[0].fsPath) {
					return vscode.workspace.openTextDocument(files[0].fsPath);
				}
				return Promise.reject();
			});

		if (!container) {
			return;
		}

		try {
			const { variables, registered } = await parseContainer(container);
			const locations = [];
			if(symbol in registered) {
				const pos = registered[symbol].loc.start;
				locations.push(new vscode.Location(container.uri, new vscode.Position(pos.line - 1, pos.column)));
			}
			if(symbol in variables) {
				const pos = variables[symbol].loc.start;
				locations.push(new vscode.Location(container.uri, new vscode.Position(pos.line - 1, pos.column)));
			}

			return locations.length ? locations : undefined;
		} catch(e) {
			console.error(e);
		}
	}
}

export function activate(ctx: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "Awilix VSCode Container Definitions" is now active!');
	vscode.window.showInformationMessage('Awilix module found. Awilix definitions support is activated...');

	ctx.subscriptions.push(vscode.languages.registerDefinitionProvider({ language: "javascript", scheme: "file" }, new AwilixDefinitionProvider()));
}

export function deactivate() {}
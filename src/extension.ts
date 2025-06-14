import * as vscode from 'vscode';
import { CustomFoldingRangeProvider } from './foldingprovider';


export function activate(context: vscode.ExtensionContext) {
  const selector: vscode.DocumentSelector = { scheme: 'file', language: '*' };

  const foldingProviderDisposable = vscode.languages.registerFoldingRangeProvider(
    selector,
    new CustomFoldingRangeProvider()
  );

  context.subscriptions.push(foldingProviderDisposable);
}


export function deactivate() {}

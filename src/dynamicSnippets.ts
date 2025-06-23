// src/dynamicSnippets.ts
import * as vscode from 'vscode';
import { getTagNames } from './utils';

let completionProviderDisposable: vscode.Disposable | null = null;

export function registerDynamicSnippets(context: vscode.ExtensionContext) {
  if (completionProviderDisposable) {
    completionProviderDisposable.dispose();
    completionProviderDisposable = null;
  }

  const tags = getTagNames();

  const selector: vscode.DocumentSelector = [
    { scheme: 'file', language: 'javascript' },
    { scheme: 'file', language: 'typescript' },
    { scheme: 'file', language: 'javascriptreact' },
    { scheme: 'file', language: 'typescriptreact' },
    { scheme: 'file', language: 'html' },
    { scheme: 'file', language: 'css' },
  ];

  completionProviderDisposable = vscode.languages.registerCompletionItemProvider(
    selector,
    {
      provideCompletionItems(document, position) {
        const line = document.lineAt(position);
        const textBefore = line.text.substring(0, position.character);

        // Detectar patrón # seguido de texto parcial al final de la línea
        const match = textBefore.match(/#(\w*)$/);
        if (!match) {
          return undefined;
        }

        const partialTag = match[1].toLowerCase();

        // Filtrar etiquetas que coincidan con el texto parcial
        const matchingTags = tags.filter(tag =>
          tag.toLowerCase().startsWith(partialTag)
        );

        const snippets = matchingTags.flatMap(tag => {
          const headerItem = new vscode.CompletionItem(`#${tag}`, vscode.CompletionItemKind.Snippet);
          headerItem.insertText = new vscode.SnippetString(`//#${tag}`);
          headerItem.detail = `Insert header for #${tag}`;
          headerItem.documentation = new vscode.MarkdownString(`Folding header for tag **${tag}**`);
          headerItem.range = new vscode.Range(
            position.translate(0, -match[1].length - 1),
            position
          );

          const footerItem = new vscode.CompletionItem(`#end-${tag}`, vscode.CompletionItemKind.Snippet);
          footerItem.insertText = new vscode.SnippetString(`//#end-${tag}`);
          footerItem.detail = `Insert footer for #${tag}`;
          footerItem.documentation = new vscode.MarkdownString(`Folding footer for tag **${tag}**`);
          footerItem.range = new vscode.Range(
            position.translate(0, -match[1].length - 1),
            position
          );

          return [headerItem, footerItem];
        });

        return snippets;
      }
    },
    '#' // Trigger solo al escribir '#'
  );

  context.subscriptions.push(completionProviderDisposable);

  // Escuchar cambios en configuración para recargar los snippets dinámicos
  vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration('colorSuitComments.tags')) {
      registerDynamicSnippets(context);
    }
  });
}

import * as vscode from 'vscode';

export class CustomFoldingRangeProvider implements vscode.FoldingRangeProvider {
  provideFoldingRanges(
    document: vscode.TextDocument,
    context: vscode.FoldingContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.FoldingRange[]> {
    const ranges: vscode.FoldingRange[] = [];
    const startStack: number[] = [];

    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i).text.trim();

      if (line.startsWith('//colapse')) {
        startStack.push(i);
      } else if (line.startsWith('//endcolapse') && startStack.length > 0) {
        const startLine = startStack.pop()!;
        const endLine = i;
        if (endLine > startLine) {
          ranges.push(new vscode.FoldingRange(startLine, endLine, vscode.FoldingRangeKind.Region));
        }
      }
    }

    return ranges;
  }
}

// src\extension.ts

//#region ⁡⁢⁣⁢Importaciones⁡
import * as vscode from 'vscode';
import { 
  applyDecorationsForBlockContent,
  applyDecorationsForTagComments,
  applyFoldingForBlocks,
  buildRegexPatterns,
  buildResolvedDecorations,
  getTagsConfig,
  getTagMatchData,
  getTagNames,
  handleEditCommand,
  handleOnDidCloseTextDocument,
  resolveTagBlocks
} from './utils';
//#endregion

//#region 🕒 ⁡⁣⁣⁢decorateDocument⁡ - Maneja la activación de decoraciones al abrir un documento
/** Maneja la activación de decoraciones al abrir un documento */
const decorateDocument = (context: vscode.ExtensionContext, document: vscode.TextDocument) => {
  //#region ✅1. Obtener etiquetas y lenguaje del documento actual y una referencia al editor -> ⁡⁣⁢⁣tags⁡, ⁡⁣⁢⁣languageId⁡, ⁡⁣⁢⁣editor⁡
  const tags = getTagNames();
  const languageId = document.languageId;
  const editor = vscode.window.visibleTextEditors.find(e => e.document === document);
  //#endregion
  //#region ✅2. Capturar las expresiones regulares de los encabezados y pies de los bloques colapsables -> ⁡⁣⁢⁣headerPatterns⁡, ⁡⁣⁢⁣footerPatterns⁡
  const {headerPatterns, footerPatterns } = buildRegexPatterns(tags, languageId);
  //#endregion 
  //#region ✅3. Captura los rangos de las aperturas y los cierres que coinciden con las expresiones regulares -> ⁡⁣⁢⁣headerMatchesData⁡, ⁡⁣⁢⁣footerMatchesData⁡ 
  const headerMatchesData = getTagMatchData(document, headerPatterns, tags, 'header');
  const footerMatchesData = getTagMatchData(document, footerPatterns, tags, 'footer');
  //#endregion
  //#region ✅4. Captura de la configuración de las etiquetas -> ⁡⁣⁢⁣tagsConfig = { tag, color?, backgroundColor? }⁡
  const tagsConfig = getTagsConfig();
  //#endregion  
  //#region ✅5. Se combinan los comentarios con sus respectivos decoradores -> ⁡⁣⁢⁣tagsCommentData = {tag, color?, backgroundColor?, type, vscode.range}⁡
  const tagsCommentData = buildResolvedDecorations([...headerMatchesData,...footerMatchesData], tagsConfig);
  //#endregion
  //#region ✅6. Emparejar bloques válidos y detectar etiquetas sin pareja -> ⁡⁣⁢⁣resolvedTags = {blocks⁡, ⁡⁣⁢⁣orphanTags} ⁡
  const resolvedTags = resolveTagBlocks(tagsCommentData);
  //#endregion
  //#region ✅7. Aplicar los decoradores a los bloques y a los huerfanos
  if(editor){
    applyDecorationsForBlockContent(editor, tagsConfig, resolvedTags);
    applyDecorationsForTagComments(editor, tagsCommentData);
  }
  //#endregion
  //#region ✅8. Aplicarle a los bloques la propiedad para que sean colapsables
  if (editor) {
    applyFoldingForBlocks(document, resolvedTags, context);
  }
  //#endregion
};
//#endregion

//#region ⁡⁣⁣⁢⭐activate⁡ - Activación de la extensión
export const activate = (context: vscode.ExtensionContext) => {
  //#region ✅1. Crea el comando editCommand y lo suscribe. Esto ejecuta ⁡⁣⁣⁢handleEditCommand⁡ cuando se le da click al botón edit
  const editCommand = vscode.commands.registerCommand('colorSuitComments.edit', handleEditCommand);
  context.subscriptions.push(editCommand);
  //#endregion
  //#region ✅2. Aplica decoraciones sobre el editor activo cada vez que cambia la visibilidad de los editores (nuevo panel, cierre, etc.). Ejecuta el método ⁡⁣⁣⁢decorateDocument⁡
  const visibleEditorsListener = vscode.window.onDidChangeVisibleTextEditors(editors => {
    editors.forEach(editor => {
      decorateDocument(context, editor.document);
    });
  });
  context.subscriptions.push(visibleEditorsListener);
  //#endregion
  //#region ✅3. Listener que aplica decoradores cada vez que el usuario cambia de pestaña o abre un archivo. Ejecuta el método ⁡⁣⁣⁢decorateDocument⁡
  const activeEditorListener = vscode.window.onDidChangeActiveTextEditor(editor => {
    editor && decorateDocument(context, editor.document);
  });
  context.subscriptions.push(activeEditorListener);
  //#endregion
  //#region ✅4. Listener que se ejecuta cuando el usuario modifica un documento visible. Ejecuta el método ⁡⁣⁣⁢decorateDocument⁡
  const changeListener = vscode.workspace.onDidChangeTextDocument(event => {
    // Solo aplicamos si el documento modificado está actualmente visible
    const isVisible = vscode.window.visibleTextEditors.some(editor => editor.document === event.document);
    if (isVisible) {
      decorateDocument(context, event.document);
    }
  });
  context.subscriptions.push(changeListener);
  //#endregion
  //#region ✅5. Loop que recorre todos los editores abiertos por el usuario y les aplica los decoradores a cada uno de ellos. Ejecuta el método ⁡⁣⁣⁢decorateDocument⁡.
  vscode.window.visibleTextEditors.forEach(editor => {
    decorateDocument(context, editor.document);
  });
  //#endregion
  //#region ✅6. Listener que se activa el cerrar un editor. Elimina todos los decoradores del editor cerrado y libera memoria para no escuchar más eventos en ese editor.
  const closeListener = vscode.workspace.onDidCloseTextDocument(handleOnDidCloseTextDocument);
  context.subscriptions.push(closeListener);
  //#endregion
};
//#endregion


export function deactivate() {}




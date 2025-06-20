// src\extension.ts

//#region ⁡⁢⁣⁢Importaciones⁡
import * as vscode from 'vscode';
import { 
  buildRegexPatterns,
  buildResolvedDecorations,
  getTagsConfig,
  getTagMatchData,
  getTagNames,
  handleEditCommand,
  handleOnDidCloseTextDocument,
} from './utils';
//#endregion

//#region 🕒 ⁡⁣⁣⁢decorateDocument⁡ - Maneja la activación de decoraciones al abrir un documento
/** Maneja la activación de decoraciones al abrir un documento */
const decorateDocument = (document: vscode.TextDocument) => {
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
  //#region ✅5. Se combinan los comentarios obtenidos con las expresiones regulares con sus respectivos decoradores -> ⁡⁣⁢⁣headerDecorations = {tag, color?, backgroundColor?, type, vscode.range}⁡
  const headerDecorations = buildResolvedDecorations(headerMatchesData, tagsConfig);
  const footerDecorations = buildResolvedDecorations(footerMatchesData, tagsConfig);

  //#endregion
  //#region ✅6. Emparejar bloques válidos y detectar etiquetas sin pareja -> ⁡⁣⁢⁣blocks⁡, ⁡⁣⁢⁣orphanTags⁡
  //#endregion



  console.log('test');
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
      decorateDocument(editor.document);
    });
  });
  context.subscriptions.push(visibleEditorsListener);
  //#endregion
  //#region ✅3. Listener que aplica decoradores cada vez que el usuario cambia de pestaña o abre un archivo. Ejecuta el método ⁡⁣⁣⁢decorateDocument⁡
  const activeEditorListener = vscode.window.onDidChangeActiveTextEditor(editor => {
    editor && decorateDocument(editor.document);
  });
  context.subscriptions.push(activeEditorListener);
  //#endregion
  //#region ✅4. Listener que se ejecuta cuando el usuario modifica un documento visible. Ejecuta el método ⁡⁣⁣⁢decorateDocument⁡
  const changeListener = vscode.workspace.onDidChangeTextDocument(event => {
    // Solo aplicamos si el documento modificado está actualmente visible
    const isVisible = vscode.window.visibleTextEditors.some(editor => editor.document === event.document);
    if (isVisible) {
      decorateDocument(event.document);
    }
  });
  context.subscriptions.push(changeListener);
  //#endregion
  //#region ✅5. Loop que recorre todos los editores abiertos por el usuario y les aplica los decoradores a cada uno de ellos. Ejecuta el método ⁡⁣⁣⁢decorateDocument⁡.
  vscode.window.visibleTextEditors.forEach(editor => {
    decorateDocument(editor.document);
  });
  //#endregion
  //#region ✅6. Listener que se activa el cerrar un editor. Elimina todos los decoradores del editor cerrado y libera memoria para no escuchar más eventos en ese editor.
  const closeListener = vscode.workspace.onDidCloseTextDocument(handleOnDidCloseTextDocument);
  context.subscriptions.push(closeListener);
  //#endregion
};
//#endregion


export function deactivate() {}




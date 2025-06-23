// src\extension.ts

//#region ⁡⁢⁣⁢Importaciones⁡
import * as vscode from 'vscode';
import { 
  decorateDocument,
  handleEditCommand,
  handleOnDidCloseTextDocument,
  hasDefinedTags,
  setDefaultTagsConfiguration
} from './utils';
//#endregion


//#region ⁡⁣⁣⁢⭐activate⁡ - Activación de la extensión
export const activate = async (context: vscode.ExtensionContext) => {
  //#region ✅1. Si no existe, crea dentro de settings.json un objeto con la configuración inicial de las etiquetas de esta extensión.
  if (!hasDefinedTags()) {
    await setDefaultTagsConfiguration();
  }
  //#endregion
  //#region ✅2. Crea el comando editCommand y lo suscribe. Esto ejecuta ⁡⁣⁣⁢handleEditCommand⁡ cuando se le da click al botón edit
  const editCommand = vscode.commands.registerCommand('colorSuitComments.edit', handleEditCommand);
  context.subscriptions.push(editCommand);
  //#endregion
  //#region ✅3. Aplica decoraciones sobre el editor activo cada vez que cambia la visibilidad de los editores (nuevo panel, cierre, etc.). Ejecuta el método ⁡⁣⁣⁢decorateDocument⁡
  const visibleEditorsListener = vscode.window.onDidChangeVisibleTextEditors(editors => {
    editors.forEach(editor => {
      decorateDocument(context, editor.document);
    });
  });
  context.subscriptions.push(visibleEditorsListener);
  //#endregion
  //#region ✅4. Listener que aplica decoradores cada vez que el usuario cambia de pestaña o abre un archivo. Ejecuta el método ⁡⁣⁣⁢decorateDocument⁡
  const activeEditorListener = vscode.window.onDidChangeActiveTextEditor(editor => {
    editor && decorateDocument(context, editor.document);
  });
  context.subscriptions.push(activeEditorListener);
  //#endregion
  //#region ✅5. Listener que se ejecuta cuando el usuario modifica un documento visible. Ejecuta el método ⁡⁣⁣⁢decorateDocument⁡
  const changeListener = vscode.workspace.onDidChangeTextDocument(event => {
    // Solo aplicamos si el documento modificado está actualmente visible
    const isVisible = vscode.window.visibleTextEditors.some(editor => editor.document === event.document);
    if (isVisible) {
      decorateDocument(context, event.document);
    }
  });
  context.subscriptions.push(changeListener);
  //#endregion
  //#region ✅6. Loop que recorre todos los editores abiertos por el usuario y les aplica los decoradores a cada uno de ellos. Ejecuta el método ⁡⁣⁣⁢decorateDocument⁡.
  vscode.window.visibleTextEditors.forEach(editor => {
    decorateDocument(context, editor.document);
  });
  //#endregion
  //#region ✅7. Listener que se activa el cerrar un editor. Elimina todos los decoradores del editor cerrado y libera memoria para no escuchar más eventos en ese editor.
  const closeListener = vscode.workspace.onDidCloseTextDocument(handleOnDidCloseTextDocument);
  context.subscriptions.push(closeListener);
  //#endregion

  context.subscriptions.push(
    // vscode.commands.registerCommand('colorSuitComments.collapseAll', () => handleCollapseAll()),
    // vscode.commands.registerCommand('colorSuitComments.expandAll', () => handleExpandAll()),
    // vscode.commands.registerCommand('colorSuitComments.collapseByTag', () => handleCollapseByTag()),
    // vscode.commands.registerCommand('colorSuitComments.expandByTag', () => handleExpandByTag())
  );

};
//#endregion


export function deactivate() {}



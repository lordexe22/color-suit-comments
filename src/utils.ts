//#region ⁡⁢⁣⁢Importaciones⁡
import * as vscode from 'vscode';
import { 
  CONFIG_KEY, 
  DEFAULT_TAGS, 
  activeDecorationsMap 
} from './config';
//#endregion
//#region ⁡⁢⁣⁢Funciones⁡
//#region ⁡⁣⁣⁢getConfiguration⁡ - Obtiene la configuración global del workspace
/** 
 * Retorna un objeto con la configuración global del workspace
 * 
 * @returns {vscode.WorkspaceConfiguration}
 * @requires vscode
 * @version 1.0.0
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const getConfiguration = (): vscode.WorkspaceConfiguration => {
  return vscode.workspace.getConfiguration();
};
//#endregion
//#region ⁡⁣⁣⁢getTagNames⁡ - Devuelve un arreglo con los nombres de las etiquetas existentes en settings.json
/** 
 * Devuelve una lista con los nombres de las etiquetas existentes en `settings.json`
 * 
 * @returns {string[]}
 * @version 1.0.0
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const getTagNames = (): string[] => {
  const config = getConfiguration();
  const tags = config.get<any[]>(CONFIG_KEY, []);
  const tagNames = tags.map(tag => tag.tag).filter(Boolean);
  return tagNames;
};
//#endregion
//#region ⁡⁣⁣⁢handleEditCommand⁡ - Función principal del comando 'edit'
/** 
 * Función principal del comando `colorSuitComments.edit`. Ejecuta las siguientes operaciones:
 * 
 * 1 - Verifica si el usuario ha creado etiquetas en la extensión. Si no ha creado ninguna, se establece la configuración por defecto de la extensión.
 * 
 * 2 - Ejecuta el método `openSettingsJson()` para abrir `settings.json` y permitirle al usuario crear, borrar o editar las etiquetas existentes.
 * 
 * @async
 * @returns {Promise<void>}
 * @version 1.0.0
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const handleEditCommand = async(): Promise<void> => {
  //#region ✅1. Evalua si el usuario ha realizado cambios a la configuración por defecto de la extensión, si no lo ha hecho, establece la configuración por defecto de las etiquetas
  if (!hasUserDefinedTags()) {
    await setDefaultTagsConfiguration();
  }
  //#endregion
  //#region ✅2. Abre el archivo settings.json para permitile al usuario realizar cambios sobre las etiquetas.
  openSettingsJson();
  //#endregion
};
//#endregion
//#region ⁡⁣⁣⁢handleOnDidCloseTextDocument⁡ - Maneja el evento que se dispara al cerrar un documento en el editor.
/**
 * Maneja el evento que se dispara al cerrar un documento en el editor.
 * Elimina todas las decoraciones asociadas al documento cerrado y limpia la referencia
 * en el mapa activo para liberar memoria y evitar escuchas innecesarias.
 *
 * @param {vscode.TextDocument} document - El documento que ha sido cerrado.
 * @returns {void}
 * @version 1.0.0
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 * @example
 * const closeListener = vscode.workspace.onDidCloseTextDocument(handleOnDidCloseTextDocument);
 * context.subscriptions.push(closeListener);
 */
export const handleOnDidCloseTextDocument = (document: vscode.TextDocument) :void => {
    const docUri = document.uri.toString();
    const decorations = activeDecorationsMap.get(docUri);
    if (decorations) {
      decorations.forEach(d => d.dispose());
      activeDecorationsMap.delete(docUri);
    }  
};
//#endregion
//#region ⁡⁣⁣⁢hasUserDefinedTags⁡ -  Verifica si el usuario ya definió algun custom tag dentro de settings.json
/** 
 * Verifica si el usuario ha definido una configuración personalizada para `colorSuitComments.tags`
 * en alguno de los niveles disponibles (global, workspace o carpeta).
 *  
 * @returns {boolean}
 * @version 1.0.0
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const hasUserDefinedTags = (): boolean => {
  const config = getConfiguration();
  const userValue = config.inspect(CONFIG_KEY);

  return Boolean(
    userValue?.globalValue ||
    userValue?.workspaceValue ||
    userValue?.workspaceFolderValue
  );
};
//#endregion
//#region ⁡⁣⁣⁢openSettingsJson⁡ -  Abre el archivo global de configuración (settings.json)
/** 
 * Abre el archivo global de configuración (settings.json)
 * 
 * @returns {void}
 * @requires vscode
 * @version 1.0.0
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const openSettingsJson = (): void => {
  vscode.commands.executeCommand('workbench.action.openSettingsJson');
};
//#endregion
//#region ⁡⁣⁣⁢setDefaultTagsConfiguration⁡ -  Establece los valores por defecto en el settings.json global
/** 
 * Establece los valores por defecto para los comentarios en el archivo settings.json global.
 * Utiliza la API de VS Code para actualizar la configuración persistente del usuario.
 * Puede generar un pequeño retardo debido a la escritura asincrónica del archivo.
 * 
 * @async
 * @returns {Promise<void>}
 * @version 1.0.0
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 * @example
 * await setDefaultTagsConfiguration();
 */
export const setDefaultTagsConfiguration = async (): Promise<void> => {
  const config = getConfiguration();
  await config.update(CONFIG_KEY, DEFAULT_TAGS, vscode.ConfigurationTarget.Global);
};
//#endregion
//#endregion







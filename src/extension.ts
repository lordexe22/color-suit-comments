import * as vscode from 'vscode';

const CONFIG_KEY = 'colorSuitComments.tags';

//#region ⁡⁣⁢⁣DEFAULT_TAGS⁡ - Define las etiquetas por defecto en la aplicación
/** Define las etiquetas por defecto en la aplicación */
const DEFAULT_TAGS = [
  {
    tag: "error",
    color: "#ff4d4f",
    backgroundColor: "#ff4d4f20",
    fontFamily: "'Comic Sans MS', cursive"
  }
];
//#endregion

//#region ⁡⁣⁣⁢getConfiguration⁡ - Obtiene la configuración global del workspace
/** Obtiene la configuración global del workspace */
const getConfiguration = () => {
  return vscode.workspace.getConfiguration();
};
//#endregion

//#region ⁡⁣⁣⁢hasUserDefinedTags⁡ -  Verifica si el usuario ya definió alguna configuración para colorSuitComments.tags
/** Verifica si el usuario ya definió alguna configuración para colorSuitComments.tags */
const hasUserDefinedTags = (): boolean => {
  const config = getConfiguration();
  const userValue = config.inspect(CONFIG_KEY);

  // Si hay un valor explícito definido por el usuario en cualquier scope, lo tomamos como presente
  return Boolean(
    userValue?.globalValue ||
    userValue?.workspaceValue ||
    userValue?.workspaceFolderValue
  );
};
//#endregion

//#region ⁡⁣⁣⁢setDefaultTagsConfiguration⁡ -  Establece los valores por defecto en el settings.json global
/** Establece los valores por defecto en el settings.json global */
const setDefaultTagsConfiguration = async () => {
  const config = getConfiguration();
  await config.update(CONFIG_KEY, DEFAULT_TAGS, vscode.ConfigurationTarget.Global);
};
//#endregion

//#region ⁡⁣⁣⁢openSettingsJson⁡ -  Abre el archivo global de configuración (settings.json)
/** Abre el archivo global de configuración (settings.json) */
const openSettingsJson = () => {
  vscode.commands.executeCommand('workbench.action.openSettingsJson');
};
//#endregion

//#region ⁡⁣⁣⁢handleEditCommand⁡ - Función principal del comando 'edit'
/**
 * Función principal del comando 'edit'
 */
const handleEditCommand = async() => {
  if (!hasUserDefinedTags()) {
    await setDefaultTagsConfiguration();
  }

  openSettingsJson();
};
//#endregion

//#region ⁡⁣⁣⁢⭐activate⁡ - Activación de la extensión
export const activate = (context: vscode.ExtensionContext) => {
  const editCommand = vscode.commands.registerCommand('colorSuitComments.edit', handleEditCommand);
  context.subscriptions.push(editCommand);
};
//#endregion

export function deactivate() {}

import * as vscode from 'vscode';


//#region ⁡⁣⁢⁣CONFIG_KEY⁡ - Nombre del campo donde se encuentran las etiquetas dentro del archivo settings.json
/** Nombre del campo donde se encuentran las etiquetas dentro del archivo settings.json */
export const CONFIG_KEY = 'colorSuitComments.tags';
//#endregion
//#region ⁡⁣⁢⁣DEFAULT_TAGS⁡ - Lista con las etiquetas por defecto en la aplicación
/** Lista con las etiquetas por defecto en la aplicación */
export const DEFAULT_TAGS = [
  {
    tag: 'error',
    color: '#ff4d4f',
    backgroundColor: '#ff4d4f10'
  },
  {
    tag: 'warning',
    color: '#ffff4f',
    backgroundColor: '#ffff4f10'
  },
  {
    tag: 'todo',
    color: '#ffa04f',
    backgroundColor: '#ffa04f10'
  },
  {
    tag: 'info',
    color: '#4080f0',
    backgroundColor: '#4080f010'
  }
];
//#endregion

// Lista de decoraciones activas para poder limpiarlas en cada actualización
export const activeDecorationsMap = new Map<string, vscode.TextEditorDecorationType[]>();

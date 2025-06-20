// src\types.ts

//#region ⁡⁢⁣⁢Importaciones⁡
import * as vscode from 'vscode';
//#endregion

export type TagMatch = {
  tag: string;
  type: 'header' | 'footer';
  range: vscode.Range;
};

export type TagBlock = {
  tag: string;
  header: TagMatch;
  footer: TagMatch;
  range: vscode.Range; // Rango desde el final del header hasta el inicio del footer (contenido del bloque)
};

/** Formato del typo de dato donde el usuario define los decoradores de la etiqueta */
export type TagConfig = {
  tag: string;
  color?: string;
  backgroundColor?: string;
}

/** Representa la fusión de una coincidencia encontrada en el documento (TagMatch) con su configuración visual definida en settings.json (TagConfig). */
export type ResolvedTagDecoration = TagMatch & TagConfig;

// Representa un bloque completo (header + footer) junto con la decoración visual aplicada a todo el bloque
export type ResolvedBlockDecoration = {
  tag: string;
  range: vscode.Range; // Rango completo del bloque: incluye header, contenido, y footer
  backgroundColor?: string;
  depth: number; // Cuanto más profundo, más prioridad visual (se renderiza después)
};




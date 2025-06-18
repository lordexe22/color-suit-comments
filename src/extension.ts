//#region ⁡⁢⁣⁢Importaciones⁡
import * as vscode from 'vscode';
import { 
  getConfiguration,
  getTagNames,
  handleEditCommand,
  handleOnDidCloseTextDocument,
  hasUserDefinedTags,
  openSettingsJson,
  setDefaultTagsConfiguration
} from './utils';
import { 
  CONFIG_KEY,
  DEFAULT_TAGS,
  activeDecorationsMap
} from './config';
//#endregion



//#region 🕒 ⁡⁣⁣⁢getTagsConfig⁡ - Obtiene la configuración completa de las etiquetas
/** Obtiene la configuración completa de las etiquetas */
const getTagsConfig = (): any[] => {
  const config = getConfiguration();
  const tags = config.get<any[]>(CONFIG_KEY, []);
  return tags;
};
//#endregion

//#region 🕒 ⁣⁣⁢getRegexPatternsForLanguage⁡ - Retorna un arreglo de expresiones regulares base para un lenguaje
/** 
 * Retorna un arreglo con expresiones regulares base, donde la palabra clave del tag
 * está como un marcador `${tag}` para luego reemplazar.
 */
const getRegexPatternsForLanguage = (languageId: string): RegExp[] => {
  switch (languageId) {
    case 'javascript':
    case 'typescript':
      return [
        new RegExp('/(\\*)+(\\s|\\*)*#${tag}(?=[\\s\\*\\/])[\\s\\S]*?\\*/', 'gm'),
        new RegExp('//\\s*#${tag}\\b.*$', 'gm')
      ];
    default:
      return [];
  }
};
//#endregion

//#region 🕒 ⁡⁣⁣⁢applyDecorationsToEditor⁡ - Aplica decoraciones según los comentarios encontrados
/** 
 * Aplica decoraciones visuales a los bloques de comentario que contienen las etiquetas.
 */
const applyDecorationsToEditor = (editor: vscode.TextEditor) => {
  const document = editor.document;
  const text = document.getText();
  const languageId = document.languageId;

  const config = vscode.workspace.getConfiguration();
  const tagConfigs = config.get<any[]>(CONFIG_KEY) || [];
  const baseRegexes = getRegexPatternsForLanguage(languageId);

  const docUri = editor.document.uri.toString();

  // Limpiar decoraciones anteriores SOLO para este documento
  const existingDecorations = activeDecorationsMap.get(docUri);
  if (existingDecorations) {
    existingDecorations.forEach(decoration => decoration.dispose());
  }

  tagConfigs.forEach(tagConfig => {
    const { tag, color, backgroundColor } = tagConfig;
    const matches: vscode.Range[] = [];

    baseRegexes.forEach(baseRegex => {
      const pattern = baseRegex.source.replace('${tag}', tag);
      const finalRegex = new RegExp(pattern, baseRegex.flags);
      let match;
      while ((match = finalRegex.exec(text)) !== null) {
        const start = document.positionAt(match.index);
        const end = document.positionAt(match.index + match[0].length);
        matches.push(new vscode.Range(start, end));
      }
    });

    const decorationType = vscode.window.createTextEditorDecorationType({
      color,
      backgroundColor,
      isWholeLine: true,
    });

    editor.setDecorations(decorationType, matches);

    if (!activeDecorationsMap.has(docUri)) {
      activeDecorationsMap.set(docUri, []);
    }
    activeDecorationsMap.get(docUri)!.push(decorationType);

  });
};
//#endregion

//#region 🕒 ⁡⁣⁣⁢handleActiveDocument⁡ - Maneja la activación de decoraciones al abrir un documento
/** Maneja la activación de decoraciones al abrir un documento */
const handleActiveDocument = (document: vscode.TextDocument) => {
  const tags = getTagNames();
  const languageId = document.languageId;

  console.log('[Color Suit Comments] Documento abierto:', document.fileName);
  console.log('[Color Suit Comments] Etiquetas cargadas:', tags);

  // Obtenemos expresiones base para el lenguaje
  const regexArray = getRegexPatternsForLanguage(languageId);

  // Para cada tag, mostramos la expresión regular resultante
  tags.forEach(tag => {
    regexArray.forEach(baseRegex => {
      // baseRegex.source tiene el pattern como string
      const patternWithTag = baseRegex.source.replace('${tag}', tag);
      const finalRegex = new RegExp(patternWithTag, baseRegex.flags);
      console.log(`[Color Suit Comments] Tag: ${tag} -> Expresión regular:`, finalRegex);
    });
  });

  const editor = vscode.window.visibleTextEditors.find(e => e.document === document);
  if (editor) {
    applyDecorationsToEditor(editor);
  }
};
//#endregion

//#region ⁡⁣⁣⁢⭐activate⁡ - Activación de la extensión
export const activate = (context: vscode.ExtensionContext) => {
  //#region ✅1. Crea el comando editCommand y lo suscribe. Esto ejecuta ⁡⁣⁣⁢handleEditCommand⁡ cuando se le da click al botón edit
  const editCommand = vscode.commands.registerCommand('colorSuitComments.edit', handleEditCommand);
  context.subscriptions.push(editCommand);
  //#endregion
  //#region ✅2. Aplica decoraciones sobre el editor activo cada vez que cambia la visibilidad de los editores (nuevo panel, cierre, etc.). Ejecuta el método ⁡⁣⁣⁢handleActiveDocument⁡
  const visibleEditorsListener = vscode.window.onDidChangeVisibleTextEditors(editors => {
    editors.forEach(editor => {
      handleActiveDocument(editor.document);
    });
  });
  context.subscriptions.push(visibleEditorsListener);
  //#endregion
  //#region ✅3. Listener que aplica decoradores cada vez que el usuario cambia de pestaña o abre un archivo. Ejecuta el método ⁡⁣⁣⁢handleActiveDocument⁡
  const activeEditorListener = vscode.window.onDidChangeActiveTextEditor(editor => {
    editor && handleActiveDocument(editor.document);
  });
  context.subscriptions.push(activeEditorListener);
  //#endregion
  //#region ✅4. Listener que se ejecuta cuando el usuario modifica un documento visible. Ejecuta el método ⁡⁣⁣⁢handleActiveDocument⁡
  const changeListener = vscode.workspace.onDidChangeTextDocument(event => {
    // Solo aplicamos si el documento modificado está actualmente visible
    const isVisible = vscode.window.visibleTextEditors.some(editor => editor.document === event.document);
    if (isVisible) {
      handleActiveDocument(event.document);
    }
  });
  context.subscriptions.push(changeListener);
  //#endregion
  //#region ✅5. Loop que recorre todos los editores abiertos por el usuario y les aplica los decoradores a cada uno de ellos. Ejecuta el método ⁡⁣⁣⁢handleActiveDocument⁡.
  vscode.window.visibleTextEditors.forEach(editor => {
    handleActiveDocument(editor.document);
  });
  //#endregion
  //#region ✅6. Listener que se activa el cerrar un editor. Elimina todos los decoradores del editor cerrado y libera memoria para no escuchar más eventos en ese editor.
  const closeListener = vscode.workspace.onDidCloseTextDocument(handleOnDidCloseTextDocument);
  context.subscriptions.push(closeListener);
  //#endregion
};
//#endregion


export function deactivate() {}




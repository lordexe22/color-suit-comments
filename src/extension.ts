import * as vscode from 'vscode';

const CONFIG_KEY = 'colorSuitComments.tags';

// Lista de decoraciones activas para poder limpiarlas en cada actualización
const activeDecorationsMap = new Map<string, vscode.TextEditorDecorationType[]>();

//#region ⁡⁣⁢⁣DEFAULT_TAGS⁡ - Define las etiquetas por defecto en la aplicación
/** Define las etiquetas por defecto en la aplicación */
const DEFAULT_TAGS = [
  {
    tag: 'error',
    color: '#ff4d4f',
    backgroundColor: '#ff4d4f20'
  },
  {
    tag: 'warning',
    color: '#ffff4f',
    backgroundColor: '#ffff4f20'
  },
  {
    tag: 'todo',
    color: '#ffa04f',
    backgroundColor: '#ffa04f20'
  },
  {
    tag: 'info',
    color: '#4080f0',
    backgroundColor: '#4080f020'
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

//#region ⁡⁣⁣⁢getTagNames⁡ - Devuelve solo los nombres de las etiquetas configuradas
/** Devuelve solo los nombres de las etiquetas configuradas */
const getTagNames = (): string[] => {
  const config = getConfiguration();
  const tags = config.get<any[]>(CONFIG_KEY, []);
  const tagNames = tags.map(tag => tag.tag).filter(Boolean);
  return tagNames;
};
//#endregion

//#region ⁡⁣⁣⁢getTagsConfig⁡ - Obtiene la configuración completa de las etiquetas
/** Obtiene la configuración completa de las etiquetas */
const getTagsConfig = (): any[] => {
  const config = getConfiguration();
  const tags = config.get<any[]>(CONFIG_KEY, []);
  return tags;
};
//#endregion

//#region ⁡⁣⁣⁢getRegexPatternsForLanguage⁡ - Retorna un arreglo de expresiones regulares base para un lenguaje
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

//#region ⁡⁣⁣⁢applyDecorationsToEditor⁡ - Aplica decoraciones según los comentarios encontrados
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

//#region ⁡⁣⁣⁢handleActiveDocument⁡ - Maneja la activación de decoraciones al abrir un documento
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
  vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor) {
      handleActiveDocument(editor.document);
    }
  });
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

  vscode.window.visibleTextEditors.forEach(editor => {
    handleActiveDocument(editor.document);
  });

  const closeListener = vscode.workspace.onDidCloseTextDocument(document => {
    const docUri = document.uri.toString();
    const decorations = activeDecorationsMap.get(docUri);
    if (decorations) {
      decorations.forEach(d => d.dispose());
      activeDecorationsMap.delete(docUri);
    }
  });
  context.subscriptions.push(closeListener);



};
//#endregion


export function deactivate() {}

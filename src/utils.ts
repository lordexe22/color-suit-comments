// src\utils.ts
//#region ⁡⁢⁣⁢Importaciones⁡
import * as vscode from 'vscode';
import { 
  CONFIG_KEY, 
  DEFAULT_TAGS, 
  activeDecorationsMap 
} from './config';
import { 
  TagBlock, 
  TagMatch,
  TagConfig,
  ResolvedTagDecoration,
  ResolvedBlockDecoration,
  BlockResult,
  OrphanResult,
  ResolvedTags,
  TagComment 
} from './types';
//#endregion
//#region ⁡⁢⁣⁢Funciones⁡
//#function ✅ ⁡⁣⁣⁢buildRegexPatternsForHeaderAndFooter⁡ - Retorna un objeto con una lista de los patrones de busqueda de encabezado y pie de los bloques colapsables.
/**
 * Genera listas de expresiones regulares para identificar encabezados (`header`) y pies (`footer`)
 * de bloques colapsables dentro de un documento de texto en función del lenguaje y las etiquetas definidas.
 *
 * @param tags - Lista con las etiquetas de los bloques colapsables.
 * @param type - ID del lenguaje del documento (por ejemplo: 'javascript', 'typescript', etc).
 * @returns {{ headerPatterns: RegExp[], footerPatterns: RegExp[] }} Objeto con listas de expresiones regulares.
 * @version 0.0.1
 * @since 0.0.1
 * @author Walter Ezequiel Puig
 */
export const buildRegexPatternsForHeaderAndFooter = (tags: string[], languageId: string): { headerPatterns: RegExp[], footerPatterns: RegExp[] } => {
  //#region ✅1 - Obtiene expresiones regulares para el header y el footer de un lenguaje de progrmaación determinado -> ⁡⁣⁢⁣headerRegexBase⁡, ⁡⁣⁢⁣footerRegexBase⁡
  const headerRegexBase = getRegexPatternsForLanguage(languageId, 'header');
  const footerRegexBase = getRegexPatternsForLanguage(languageId, 'footer');
  //#endregion
  //#region ✅2 - Construye expresiones completas para headers que incluyen todas las etiquetas personalizadas -> ⁡⁣⁢⁣headerPatterns⁡
  const headerPatterns = tags.flatMap(tag =>
    headerRegexBase.map(baseRegex => {
      const pattern = baseRegex.source.replace('${tag}', tag);
      return new RegExp(pattern, baseRegex.flags);
    })
  );
  //#endregion
  //#region ✅3 - Construye expresiones completas para footers que incluyen todas las etiquetas personalizadas -> ⁡⁣⁢⁣headerPatterns⁡
  const footerPatterns = tags.flatMap(tag =>
    footerRegexBase.map(baseRegex => {
      const pattern = baseRegex.source.replace('${tag}', tag);
      return new RegExp(pattern, baseRegex.flags);
    })
  );
  //#endregion
  return { headerPatterns, footerPatterns };
};
//#end-function
//#function ✅ ⁡⁣⁣⁢clearDecorationsForDocument⁡ - Elimina decoradores activos de un documento antes de aplicar nuevos.
/**
 * Elimina todas las decoraciones visuales activas asociadas a un documento específico.
 * 
 * Este método limpia cualquier decorador aplicado previamente sobre el documento en `activeDecorationsMap`,
 * lo que permite aplicar nuevas decoraciones sin superposiciones, residuos o conflictos visuales.
 * 
 * Es útil tanto cuando se actualiza el contenido del documento como cuando se cierra el archivo.
 *
 * @param {vscode.TextDocument} document - El documento del cual se deben eliminar las decoraciones activas.
 * @returns {void}
 * @example
 * const listener = vscode.workspace.onDidCloseTextDocument(clearDecorationsForDocument);
 * context.subscriptions.push(listener);
 * @version 0.0.1
 * @since 0.0.1
 * @author Walter Ezequiel Puig
 * 
 */
export const clearDecorationsForDocument = (document: vscode.TextDocument) => {
  const key = document.uri.toString();
  const activeDecorations = activeDecorationsMap.get(key);
  
  if (activeDecorations && activeDecorations.length > 0) {
    for (const decoration of activeDecorations) {
      decoration.dispose();
    }
    activeDecorationsMap.delete(key);
  }
};
//#end-function
//#function ✅ ⁡⁣⁣⁢getTagsConfiguration⁡ - Obtiene la configuración completa de las etiquetas desde settings.json
/**
 * Obtiene la configuración de etiquetas definida por el usuario en el archivo
 * `settings.json`, bajo la clave personalizada del workspace (`colorSuitComments.tags`).
 * 
 * Cada entrada debe contener al menos:
 * - `tag` (string): identificador de la etiqueta personalizada (por ejemplo, "error").
 * 
 * Opcionalmente puede contener:
 * - `color` (string): color del texto de la etiqueta.
 * - `backgroundColor` (string): color de fondo para la línea que contiene la etiqueta.
 * 
 * Entradas incompletas o malformadas serán ignoradas.
 * 
 * @returns {TagConfig[]} Un arreglo de configuraciones válidas para aplicar decoradores.
 *
 * @example
 * const configs = getTagsConfiguration();
 * configs.forEach(cfg => {
 *   console.log(cfg.tag, cfg.color, cfg.backgroundColor);
 * });
 * 
 * @version 0.0.1
 * @since 0.0.1
 * @author Walter Ezequiel Puig
 */
export const getTagsConfiguration = (): TagConfig[] => {
  const config = vscode.workspace.getConfiguration();
  const rawConfig = config.get<any[]>(CONFIG_KEY, []);

  const isValid = (entry: any): entry is TagConfig =>
    typeof entry?.tag === 'string';

  return rawConfig.filter(isValid);
};
//#end-function
//#function ✅ ⁡⁣⁣⁢getWorkspaceConfiguration⁡ - Obtiene la configuración global del workspace
/** 
 * Retorna el objeto de configuración activo de VS Code.
 *
 * Los valores obtenidos con `.get()` respetan la siguiente prioridad:
 * 1. settings.json de carpeta (en workspaces multi-root)
 * 2. settings.json del workspace
 * 3. settings.json global del usuario
 *
 * El valor más específico definido prevalece. Para ver todos los niveles, usar `.inspect(clave)`.
 *
 * @returns {vscode.WorkspaceConfiguration}
 * @version 0.0.1
 * @since 0.0.1
 * @author Walter Ezequiel Puig
 */
export const getWorkspaceConfiguration = (): vscode.WorkspaceConfiguration => {
  return vscode.workspace.getConfiguration();
};
//#end-function
//#function ✅ ⁡⁣⁣⁢getTagNames⁡ - Devuelve un arreglo con los nombres de las etiquetas existentes en settings.json
/** 
 * Devuelve una lista con los nombres de las etiquetas existentes en `settings.json`.
 * En caso de tener más de una fuente de configuración, se establece el siguiente orden de prioridad:
 * 
 * 1. Folder (./.vscode/settings.json)
 *
 * 2. Workspace (*.code-workspace)
 * 
 * 3. Global (~/.config/Code/User/settings.json)
 * 
 * @returns {string[]} Arreglo con los nombres de las etiquetas de la extensión
 * @version 0.0.1
 * @since 0.0.1
 * @author Walter Ezequiel Puig
 */
export const getTagNames = (): string[] => {
  const config = getWorkspaceConfiguration();
  const tags = config.get<TagConfig[]>(CONFIG_KEY, []);
  const tagNames = tags.map(tag => tag.tag).filter(Boolean);
  return tagNames;
};
//#end-function
//#function ✅ ⁡⁣⁣⁢handleEditCommand⁡ - Función principal del comando 'edit'
/**
 * Función principal del comando `colorSuitComments.edit`. 
 * 
 * Esta función abre el archivo de configuración global `settings.json`, donde el usuario
 * podrá modificar las etiquetas de la aplicación.
 *
 * @returns {void} 
 * 
 * @example
 * ```typescript
 * const editCommand = vscode.commands.registerCommand('colorSuitComments.edit', handleEditCommand);
 * context.subscriptions.push(editCommand);
 * ```
 *
 * @version 0.0.1
 * @since 0.0.1
 * @author Walter Ezequiel Puig
 */
export const handleEditCommand = (): void => {
  vscode.commands.executeCommand('workbench.action.openSettingsJson');
};
//#end-function
//#function ✅ ⁡⁣⁣⁢handleOnDidCloseTextDocument⁡ - Maneja el evento que se dispara al cerrar un documento en el editor.
/**
 * Maneja el evento que se dispara al cerrar un documento en el editor.
 * Elimina todas las decoraciones asociadas al documento cerrado y limpia la referencia
 * en el mapa activo para liberar memoria y evitar escuchas innecesarias.
 *
 * @param {vscode.TextDocument} document - El documento que ha sido cerrado.
 * @returns {void}
 * @example
 * const closeListener = vscode.workspace.onDidCloseTextDocument(handleOnDidCloseTextDocument);
 * context.subscriptions.push(closeListener);
 * @version 0.0.1
 * @since 0.0.1
 * @author Walter Ezequiel Puig
 */
export const handleOnDidCloseTextDocument = (document: vscode.TextDocument) :void => {
    const docUri = document.uri.toString();
    const decorations = activeDecorationsMap.get(docUri);
    if (decorations) {
      decorations.forEach(d => d.dispose());
      activeDecorationsMap.delete(docUri);
    }  
};
//#end-function
//#function ✅ ⁡⁣⁣⁢hasDefinedTags⁡ -  Verifica si existen etiquetas dentro de settings.json
/** 
 * Verifica la existencia de etiquetas dentro de `colorSuitComments.tags` en `settings.json`
 * en alguno de los niveles disponibles (global, workspace o carpeta).
 *  
 * @returns {boolean}
 * @version 0.0.1
 * @since 0.0.1
 * @author Walter Ezequiel Puig
 */
export const hasDefinedTags = (): boolean => {
  const config = getWorkspaceConfiguration();
  const userValue = config.inspect(CONFIG_KEY);

  return Boolean(
    userValue?.globalValue ||
    userValue?.workspaceValue ||
    userValue?.workspaceFolderValue
  );
};
//#end-function
//#function ✅ ⁡⁣⁣⁢setDefaultTagsConfiguration⁡ -  Establece los valores por defecto en el settings.json global
/** 
 * Establece los valores por defecto para los comentarios en el archivo `settings.json` global.
 * Utiliza la API de VSCode para actualizar la configuración persistente del usuario.
 * Puede generar un pequeño retardo debido a la escritura asincrónica del archivo.
 * 
 * @async
 * @returns {Promise<void>}
 * @version 0.0.1
 * @since 0.0.1
 * @author Walter Ezequiel Puig
 * @example
 * await setDefaultTagsConfiguration();
 */
export const setDefaultTagsConfiguration = async (): Promise<void> => {
  const config = getWorkspaceConfiguration();
  await config.update(CONFIG_KEY, DEFAULT_TAGS, vscode.ConfigurationTarget.Global);
};
//#end-function
//#endregion
//#region ⁡⁢⁣⁢Refactorizar⁡
//#function 🕒 ⁡⁣⁣⁢getRegexPatternsForLanguage⁡ - Retorna un arreglo de regex base para header o footer según el tipo
/**
 * Retorna un arreglo con expresiones regulares para un identificar los patrones de apertura y cierre de los bloques colapsables.
 * Funciona para diferentes lenguajes de programación y identifica el patrón de apertura o el de cierre del bloque colapsable.
 * 
 * @param languageId - ID del lenguaje (e.g., 'javascript')
 * @param type - 'header' | 'footer'
 * @returns {RegExp[]} Lista de expresiones regulares.
 * @version 0.0.3
 * @since 0.0.1
 * @author Walter Ezequiel Puig
 */
export const getRegexPatternsForLanguage = (languageId: string, type: 'header' | 'footer'): RegExp[] => {
  const prefix = type === 'header' ? '#' : '#end-';
  switch (languageId) {
    case 'javascript':
    case 'typescript':
    case 'c':
    case 'cpp':
    case 'csharp':
    case 'java':
      return [
        new RegExp(`/(\\*)+(\\s|\\*)*${prefix}\${tag}(?=[\\s\\*\\/])[\\s\\S]*?\\*/`, 'gm'),
        new RegExp(`//\\s*${prefix}\${tag}\\b.*$`, 'gm')
      ];
    case 'css':
      return[
        new RegExp(`/(\\*)+(\\s|\\*)*${prefix}\${tag}(?=[\\s\\*\\/])[\\s\\S]*?\\*/`, 'gm')
      ];
    case 'html':
      return[
        new RegExp(`<!--\\s*${prefix}\\\${tag}\\b[\\s\\S]*?-->`, 'gm')      
      ];
    case 'python':
      return [
        new RegExp(`#(\\s|#)*${prefix}\${tag}(.)*(\\n)?`, 'gm')
      ];
    case 'php':
      return [
        new RegExp(`/(\\*)+(\\s|\\*)*${prefix}\${tag}(?=[\\s\\*\\/])[\\s\\S]*?\\*/`, 'gm'),
        new RegExp(`//\\s*${prefix}\${tag}\\b.*$`, 'gm'),
        new RegExp(`#(\\s|#)*${prefix}\${tag}(.)*(\\n)?`, 'gm')
      ];
    default:
      return [];
  }
};
//#end-function
//#function 🕒 ⁡⁣⁣⁢getTagMatchData⁡ - Retorna coincidencias con su tag, tipo y rango
/**
 * Busca coincidencias entre una lista de expresiones regulares y un documento de VSCode,
 * y devuelve un arreglo de objetos `TagMatch`, que contienen el rango de la coincidencia,
 * el tipo (header o footer), y el tag detectado.
 *
 * @param document - Documento de VS Code a analizar.
 * @param regexList - Lista de expresiones regulares aplicables al tipo (header o footer).
 * @param tags - Lista de nombres de etiqueta válidos para buscar en los matches.
 * @param type - Tipo de patrón a buscar: 'header' o 'footer'.
 * 
 * @returns TagMatch[] - Lista de coincidencias que contienen: el `range`, el `tag` detectado y su `type`.
 *
 * @example
 * const result = getTagMatchesInDocument(document, footerPatterns, ['error', 'info'], 'footer');
 * // [
 * @version 0.0.1
 * @since 0.0.1
 * @author Walter Ezequiel Puig
 */
export const getTagMatchData = (
  document: vscode.TextDocument,
  regexList: RegExp[],
  tags: string[],
  type: 'header' | 'footer'
): TagMatch[] => {
  const text = document.getText();
  const matches: TagMatch[] = [];

  regexList.forEach(regex => {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const matchedText = match[0];
      const tag = tags.find(tag => {
        const expected = type === 'footer' ? `#end-${tag}` : `#${tag}`;
        return matchedText.includes(expected);
      });

      if (tag) {
        const start = document.positionAt(match.index);
        const end = document.positionAt(match.index + matchedText.length);
        matches.push({
          tag,
          type,
          range: new vscode.Range(start, end)
        });
      }
    }
  });

  return matches;
};
//#end-function
//#function 🕒 ⁡⁣⁣⁢buildResolvedDecorations⁡ - Une coincidencias con configuraciones
/**
 * Combina una lista de coincidencias (TagMatch) con la configuración de etiquetas (TagConfig)
 * para obtener decoradores resueltos por coincidencia.
 *
 * @param matches - Coincidencias encontradas en el documento
 * @param tagsConfig - Configuraciones visuales de las etiquetas
 * @returns Lista de ResolvedTagDecoration
 */
export const buildResolvedDecorations = (
  matches: TagMatch[],
  tagsConfig: TagConfig[]
): ResolvedTagDecoration[] => {
  return matches
    .map(match => {
      const config = tagsConfig.find(cfg => cfg.tag === match.tag);
      if (!config) {
        return null;
      }
      return {
        ...match,
        color: config.color,
        backgroundColor: config.backgroundColor,
      };
    })
    .filter((d): d is NonNullable<typeof d> => {
      return d !== null;
    })
    .sort((a, b) => {
    const lineDiff = a.range.start.line - b.range.start.line;
    if (lineDiff !== 0) {
      return lineDiff;
    }
    return a.range.start.character - b.range.start.character;
  });
    
};

//#end-function
//#function 🕒 ⁡⁣⁣⁢resolveTagBlocks⁡ - Retorna un objeto que identifica el rango de los bloques y de los huerfanos del documento
export function resolveTagBlocks(tagsCommentData: TagComment[]): ResolvedTags {
  const blocks: BlockResult[] = [];
  const orphans: OrphanResult[] = [];

  function resolveLevel(startIndex: number, endIndex: number, depth: number): void {
    let i = startIndex;

    while (i < endIndex) {
      const current = tagsCommentData[i];

      // Sólo analizamos headers
      if (current.type === 'header') {
        const tag = current.tag;
        let counter = 1;
        let j = i + 1;

        while (j < endIndex) {
          const next = tagsCommentData[j];
          if (next.tag === tag) {
            if (next.type === 'header') {counter++;}
            if (next.type === 'footer') {counter--;}
          }

          if (counter === 0) {
            // Bloque cerrado correctamente
            const range = new vscode.Range(
              current.range.start,
              next.range.end
            );

            blocks.push({
              tag,
              range,
              depth,
            });

            // Llamada recursiva para analizar dentro del bloque
            resolveLevel(i + 1, j, depth + 1);

            i = j + 1; // Continuar después del footer
            break;
          }

          j++;
        }

        if (counter !== 0) {
          // Si no se cerró el bloque, es huérfano
          orphans.push({ tag, range: current.range });
          i++; // Continuar con el siguiente
        }
      } else if (current.type === 'footer') {
        // Footer sin header correspondiente
        orphans.push({ tag: current.tag, range: current.range });
        i++;
      } else {
        // Por si hay tipos desconocidos
        i++;
      }
    }
  }

  // Ejecutar análisis desde el inicio con profundidad 0
  resolveLevel(0, tagsCommentData.length, 0);

  return { blocks, orphans };
}
//#end-function
//#function 🕒 ⁡⁣⁣⁢decorateDocument⁡ - Maneja la activación de decoraciones al abrir un documento
/** Maneja la activación de decoraciones al abrir un documento */
export const decorateDocument = (context: vscode.ExtensionContext, document: vscode.TextDocument) => {
  //#region ✅1. Obtener etiquetas y lenguaje del documento actual y una referencia al editor -> ⁡⁣⁢⁣tags⁡, ⁡⁣⁢⁣languageId⁡, ⁡⁣⁢⁣editor⁡
  const tags = getTagNames();
  const languageId = document.languageId;
  const editor = vscode.window.visibleTextEditors.find(e => e.document === document);
  //#endregion
  //#region ✅2. Capturar las expresiones regulares de los encabezados y pies de los bloques colapsables -> ⁡⁣⁢⁣headerPatterns⁡, ⁡⁣⁢⁣footerPatterns⁡
  const {headerPatterns, footerPatterns } = buildRegexPatternsForHeaderAndFooter(tags, languageId);
  //#endregion 
  //#region ✅3. Captura los rangos de las aperturas y los cierres que coinciden con las expresiones regulares -> ⁡⁣⁢⁣headerMatchesData⁡, ⁡⁣⁢⁣footerMatchesData⁡ 
  const headerMatchesData = getTagMatchData(document, headerPatterns, tags, 'header');
  const footerMatchesData = getTagMatchData(document, footerPatterns, tags, 'footer');
  //#endregion
  //#region ✅4. Captura de la configuración de las etiquetas -> ⁡⁣⁢⁣tagsConfig = { tag, color?, backgroundColor? }⁡
  const tagsConfig = getTagsConfiguration();
  //#endregion  
  //#region ✅5. Se combinan los comentarios con sus respectivos decoradores -> ⁡⁣⁢⁣tagsCommentData = {tag, color?, backgroundColor?, type, vscode.range}⁡
  const tagsCommentData = buildResolvedDecorations([...headerMatchesData,...footerMatchesData], tagsConfig);
  //#endregion
  //#region ✅6. Emparejar bloques válidos y detectar etiquetas sin pareja -> ⁡⁣⁢⁣resolvedTags = {blocks⁡, ⁡⁣⁢⁣orphanTags} ⁡
  const resolvedTags = resolveTagBlocks(tagsCommentData);
  //#endregion
  
  //#region 6a. Auxiliar - elimina los decoradores existentes en el documento antes de aplicarle los nuevos
  clearDecorationsForDocument(document);
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
//#end-function
//#function 🕒 ⁡⁣⁣⁢applyDecorationsForBlockContent⁡
export const applyDecorationsForBlockContent = (
  editor:vscode.TextEditor, 
  tagsConfig:TagConfig[],
  resolvedTags:ResolvedTags
) => {
  const blocks = resolvedTags.blocks.sort((a,b) => a.depth - b.depth);

  // Se aplican los decoradores a los bloques, desde el menos al mas profundo (depth)
  for (const block of blocks){
    const config = tagsConfig.find(cfg => cfg.tag === block.tag); // Identifica la configuracion para el tag actual
    if (!config?.backgroundColor) {continue;} // Si no tiene bgColor abandonamos esta iteracion en el bucle
    const backgroundDecorator = vscode.window.createTextEditorDecorationType({
      backgroundColor: config.backgroundColor,      
      isWholeLine: true,
    });

    const start = block.range.start;
    const end = block.range.end;

    // Ajustar para excluir header y footer (líneas del header y footer)
    const adjustedStart = start.line + 1 <= end.line ? start.translate(1, 0) : start;
    const adjustedEnd = end.line - 1 >= start.line ? end.translate(-1, 0) : end;

    const adjustedRange = new vscode.Range(adjustedStart, adjustedEnd);

    editor.setDecorations(backgroundDecorator, [adjustedRange]);
    
    const key = editor.document.uri.toString();
    if (!activeDecorationsMap.has(key)) {
      activeDecorationsMap.set(key, []);
    }
    activeDecorationsMap.get(key)?.push(backgroundDecorator);
  }
};
//#end-function
//#function 🕒 ⁡⁣⁣⁢applyDecorationsForTagComments⁡
export const applyDecorationsForTagComments = (
  editor: vscode.TextEditor,
  tagsCommentData: ResolvedTagDecoration[]
) => {
  const groupedByStyle = new Map<string, vscode.Range[]>();

  for (const comment of tagsCommentData) {
    // Creamos una clave única para cada combinación de estilos
    const styleKey = `${comment.backgroundColor ?? 'none'}|${comment.color ?? 'none'}`;

    if (!groupedByStyle.has(styleKey)) {
      groupedByStyle.set(styleKey, []);
    }

    groupedByStyle.get(styleKey)?.push(comment.range);
  }

  // Creamos un decorador para cada combinación única de estilos y lo aplicamos
  for (const [styleKey, ranges] of groupedByStyle.entries()) {
    const [backgroundColor, color] = styleKey.split('|');

    const decorator = vscode.window.createTextEditorDecorationType({
      backgroundColor: backgroundColor !== 'none' ? backgroundColor : undefined,
      color: color !== 'none' ? color : undefined,
      isWholeLine: true,
      
    });

    editor.setDecorations(decorator, ranges);

    const key = editor.document.uri.toString();
    if (!activeDecorationsMap.has(key)) {
      activeDecorationsMap.set(key, []);
    }
    activeDecorationsMap.get(key)?.push(decorator);
    
  }
};
//#end-function
//#function 🕒 ⁡⁣⁣⁢applyFoldingForBlocks⁡
let foldingProviderDisposable: vscode.Disposable | null = null;
export const applyFoldingForBlocks = (
  document: vscode.TextDocument,
  resolvedTags: ResolvedTags,
  context: vscode.ExtensionContext
) => {
  if (foldingProviderDisposable) {
    foldingProviderDisposable.dispose();
  }

  const provider: vscode.FoldingRangeProvider = {
    provideFoldingRanges(doc, _, __) {
      if (doc.uri.toString() !== document.uri.toString()) { return []; }

      return resolvedTags.blocks.map(block => {
        return new vscode.FoldingRange(
          block.range.start.line,
          block.range.end.line,
          vscode.FoldingRangeKind.Region
        );
      });
    }
  };

  const selector: vscode.DocumentSelector = {
    language: document.languageId,
    scheme: 'file'
  };

  foldingProviderDisposable = vscode.languages.registerFoldingRangeProvider(selector, provider);
  context.subscriptions.push(foldingProviderDisposable);
};
//#end-function
//#function 🕒 collapseAll
export async function collapseAll() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { return; }

  const document = editor.document;
  const tags = getTagNames();
  const languageId = document.languageId;
  const { headerPatterns, footerPatterns } = buildRegexPatternsForHeaderAndFooter(tags, languageId);
  const headerMatchesData = getTagMatchData(document, headerPatterns, tags, 'header');
  const footerMatchesData = getTagMatchData(document, footerPatterns, tags, 'footer');
  const tagsConfig = getTagsConfiguration();
  const tagsCommentData = buildResolvedDecorations([...headerMatchesData, ...footerMatchesData], tagsConfig);
  const resolvedTags = resolveTagBlocks(tagsCommentData);

  for (const block of resolvedTags.blocks) {
    await vscode.commands.executeCommand('editor.fold', { selectionLines: [block.range.start.line] });
  }
}
// #end-function
//#function 🕒 expandAll
export async function expandAll() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { return; }

  const document = editor.document;
  const tags = getTagNames();
  const languageId = document.languageId;
  const { headerPatterns, footerPatterns } = buildRegexPatternsForHeaderAndFooter(tags, languageId);
  const headerMatchesData = getTagMatchData(document, headerPatterns, tags, 'header');
  const footerMatchesData = getTagMatchData(document, footerPatterns, tags, 'footer');
  const tagsConfig = getTagsConfiguration();
  const tagsCommentData = buildResolvedDecorations([...headerMatchesData, ...footerMatchesData], tagsConfig);
  const resolvedTags = resolveTagBlocks(tagsCommentData);

  for (const block of resolvedTags.blocks) {
    await vscode.commands.executeCommand('editor.unfold', { selectionLines: [block.range.start.line] });
  }
}
// #end-function
//#function 🕒 handleToggleCollapse
let isCollapsed = false; // Estado global para toggle
export async function handleToggleCollapse() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { return; }

  const document = editor.document;
  const tags = getTagNames();
  const languageId = document.languageId;
  const { headerPatterns, footerPatterns } = buildRegexPatternsForHeaderAndFooter(tags, languageId);
  const headerMatchesData = getTagMatchData(document, headerPatterns, tags, 'header');
  const footerMatchesData = getTagMatchData(document, footerPatterns, tags, 'footer');
  const tagsConfig = getTagsConfiguration();
  const tagsCommentData = buildResolvedDecorations([...headerMatchesData, ...footerMatchesData], tagsConfig);
  const resolvedTags = resolveTagBlocks(tagsCommentData);

  if (!isCollapsed) {
    // Colapsar todos los bloques
    for (const block of resolvedTags.blocks) {
      await vscode.commands.executeCommand('editor.fold', { selectionLines: [block.range.start.line] });
    }
  } else {
    // Expandir todos los bloques
    for (const block of resolvedTags.blocks) {
      await vscode.commands.executeCommand('editor.unfold', { selectionLines: [block.range.start.line] });
    }
  }

  isCollapsed = !isCollapsed; // Cambiar estado para próxima ejecución
}
// #end-function
//#function 🕒 getCommentLine - Retorna una línea de comentario formateado para la extensión del documento actual
/**
 * Genera una línea de comentario con una etiqueta formateada según el lenguaje del documento.
 * Se prioriza el estilo de comentario de una sola línea.
 * 
 * @param languageId - ID del lenguaje (e.g., 'javascript', 'css', 'html')
 * @param tag - Etiqueta como 'header' o 'end-header'
 * @returns Línea de comentario con formato adaptado
 * @version 0.0.3
 * @since 0.0.3
 * @author Walter Ezequiel Puig
 */
export const getCommentLine = (
  languageId: string,
  tag: string
): string => {
  switch (languageId) {
    case 'javascript':
    case 'typescript':
    case 'c':
    case 'cpp':
    case 'csharp':
    case 'java':
    case 'php':
      return `// #${tag}`;
    case 'css':
      return `/* #${tag} */`;
    case 'html':
      return `<!-- #${tag} -->`;
    case 'python':
      return `# #${tag}`;
    default:
      return `#${tag}`; // fallback genérico
  }
};
//#end-function
//#endregion



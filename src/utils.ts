// src\utils.ts

//#region ⁡⁢⁣⁢Importaciones⁡
import * as vscode from 'vscode';
import { 
  CONFIG_KEY, 
  DEFAULT_TAGS, 
  activeDecorationsMap 
} from './config';
import { TagBlock, TagMatch, TagConfig, ResolvedTagDecoration, ResolvedBlockDecoration } from './types';
//#endregion
//#region ⁡⁢⁣⁢Funciones⁡
//#region ✅ ⁡⁣⁣⁢handleEditCommand⁡ - Función principal del comando 'edit'
/**
 * Función principal del comando `colorSuitComments.edit`. 
 * 
 * Esta función gestiona el flujo completo de edición de etiquetas de comentarios,
 * asegurando que el usuario tenga acceso a la configuración necesaria.
 *
 * @description Ejecuta las siguientes operaciones de forma secuencial:
 * 1. Verifica si el usuario ha creado etiquetas personalizadas en la extensión
 * 2. Si no existen etiquetas, establece la configuración por defecto automáticamente
 * 3. Abre el archivo settings.json para permitir la edición de etiquetas
 *
 * @async
 * @throws {Error} Mensaje de error si falla la operación
 * @returns {Promise<void>} Una promesa que se resuelve cuando todas las operaciones se completan exitosamente
 * 
 * @example
 * ```typescript
 * // Uso básico del comando
 * await handleEditCommand();
 * ```
 *
 * @see {@link hasUserDefinedTags} - Función que verifica etiquetas del usuario
 * @see {@link setDefaultTagsConfiguration} - Función que establece configuración por defecto
 * @see {@link openSettingsJson} - Función que abre el archivo de configuración
 * 
 * @version 1.0.0
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const handleEditCommand = async(): Promise<void> => {
  try {
    if (!hasUserDefinedTags()) {
      await setDefaultTagsConfiguration();
    }
    openSettingsJson();
  } catch (error) {
    console.error('handleEditCommand -> Error al operar el comando colorSuitComments.edit', error);
  }
};
//#endregion
//#region ✅ ⁡⁣⁣⁢openSettingsJson⁡ -  Abre el archivo global de configuración (settings.json)
/** 
 * Abre el archivo de configuración global `settings.json`
 * 
 * @returns {void}
 * @requires vscode
 * @throws {Error} Si no se logra abrir settings.json
 * @version 1.0.0
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const openSettingsJson = (): void => {
  try {
    vscode.commands.executeCommand('workbench.action.openSettingsJson');
  } catch (error) {
    console.error('openSettingsJson() - Error abriendo settings.json', error);
  }
};
//#endregion
//#endregion

//#region 🕒 ⁡⁣⁣⁢buildRegexPatterns⁡ - Retorna un objeto con una lista de los patrones de busqueda de encabezado y pie de los bloques colapsables.
/**
 * Retorna un objeto con una lista de los patrones de busqueda de los encabezados y pies de los bloques colapsables.
 * 
 * @param tags - Lista con las etiquetas de los bloques colapsables.
 * @param type - ID del lenguaje del documento (por ejemplo: 'javascript', 'typescript').
 * @returns {{ headerPatterns: RegExp[], footerPatterns: RegExp[] }} Objeto con listas de expresiones regulares.
 * @version 1.0.0
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const buildRegexPatterns = (tags: string[], languageId: string): { headerPatterns: RegExp[], footerPatterns: RegExp[] } => {
  const headerBase = getRegexPatternsForLanguage(languageId, 'header');
  const footerBase = getRegexPatternsForLanguage(languageId, 'footer');

  const headerPatterns = tags.flatMap(tag =>
    headerBase.map(baseRegex => {
      const pattern = baseRegex.source.replace('${tag}', tag);
      return new RegExp(pattern, baseRegex.flags);
    })
  );

  const footerPatterns = tags.flatMap(tag =>
    footerBase.map(baseRegex => {
      const pattern = baseRegex.source.replace('${tag}', tag);
      return new RegExp(pattern, baseRegex.flags);
    })
  );

  return { headerPatterns, footerPatterns };
};
//#endregion
//#region 🕒 ⁡⁣⁣⁢getConfiguration⁡ - Obtiene la configuración global del workspace
/** 
 * Retorna un objeto con la configuración global del workspace
 * 
 * @returns {vscode.WorkspaceConfiguration}
 * @version 1.0.0
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const getConfiguration = (): vscode.WorkspaceConfiguration => {
  return vscode.workspace.getConfiguration();
};
//#endregion

//#region 🕒 ⁡⁣⁣⁢getTagNames⁡ - Devuelve un arreglo con los nombres de las etiquetas existentes en settings.json
/** 
 * Devuelve una lista con los nombres de las etiquetas existentes en `settings.json`
 * 
 * @returns {string[]} Arreglo con los nombres de las etiquetas de la extensión
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

//#region 🕒 ⁡⁣⁣⁢handleOnDidCloseTextDocument⁡ - Maneja el evento que se dispara al cerrar un documento en el editor.
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
//#region 🕒 ⁡⁣⁣⁢hasUserDefinedTags⁡ -  Verifica si el usuario ya definió algun custom tag dentro de settings.json
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
//#region 🕒 ⁡⁣⁣⁢setDefaultTagsConfiguration⁡ -  Establece los valores por defecto en el settings.json global
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
//#region 🕒 ⁡⁣⁣⁢getRegexPatternsForLanguage⁡ - Retorna un arreglo de regex base para header o footer según el tipo
/**
 * Retorna un arreglo con expresiones regulares para un identificar los patrones de apertura y cierre de los bloques colapsables.
 * Funciona para diferentes lenguajes de programación y identifica el patrón de apertura o el de cierre del bloque colapsable.
 * 
 * @param languageId - ID del lenguaje (e.g., 'javascript')
 * @param type - 'header' | 'footer'
 * @returns {RegExp[]} Lista de expresiones regulares.
 * @version 1.0.0
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const getRegexPatternsForLanguage = (languageId: string, type: 'header' | 'footer'): RegExp[] => {
  const prefix = type === 'header' ? '#' : '#end-';
  switch (languageId) {
    case 'javascript':
    case 'typescript':
      return [
        new RegExp(`/(\\*)+(\\s|\\*)*${prefix}\${tag}(?=[\\s\\*\\/])[\\s\\S]*?\\*/`, 'gm'),
        new RegExp(`//\\s*${prefix}\${tag}\\b.*$`, 'gm')
      ];
    default:
      return [];
  }
};
//#endregion
//#region 🕒 ⁡⁣⁣⁢getTagMatcheData⁡ - Retorna coincidencias con su tag, tipo y rango
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
 * //   { tag: 'error', type: 'header', range: Range(...) },
 * //   { tag: 'info', type: 'footer', range: Range(...) }
 * // ]
 *
 * @version 1.0.0
 * @since 1.0.0
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
//#endregion
//#region 🕒 ⁡⁣⁣⁢getTagsConfig⁡ - Obtiene la configuración completa de las etiquetas desde settings.json
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
 * const configs = getTagsConfig();
 * configs.forEach(cfg => {
 *   console.log(cfg.tag, cfg.color, cfg.backgroundColor);
 * });
 * 
 * @version 1.0.0
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const getTagsConfig = (): TagConfig[] => {
  const config = vscode.workspace.getConfiguration();
  const rawConfig = config.get<any[]>(CONFIG_KEY, []);

  const isValid = (entry: any): entry is TagConfig =>
    typeof entry?.tag === 'string';

  return rawConfig.filter(isValid);
};

//#endregion
//#region 🕒 ⁡⁣⁣⁢buildResolvedDecorations⁡ - Une coincidencias con configuraciones

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
    });
};

//#endregion
//#region 🕒 ⁡⁣⁣⁢applyResolvedDecorationsToEditor⁡ - Aplica decoraciones desde ResolvedTagDecoration[]
/**
 * Aplica decoraciones visuales en un editor a partir de una lista de ResolvedTagDecoration.
 * Agrupa por combinación única de estilo (color + fondo) para eficiencia.
 *
 * @param editor - Editor sobre el cual aplicar las decoraciones
 * @param decorations - Lista de decoraciones resueltas desde el documento
 */
export const applyResolvedDecorationsToEditor = (
  editor: vscode.TextEditor,
  decorations: ResolvedTagDecoration[]
): void => {
  const docUri = editor.document.uri.toString();

  // 1️⃣ Limpiar decoraciones anteriores
  if (activeDecorationsMap.has(docUri)) {
    for (const decoration of activeDecorationsMap.get(docUri)!) {
      decoration.dispose();
    }
    activeDecorationsMap.delete(docUri);
  }

  // 2️⃣ Agrupar por estilo único
  const grouped = new Map<
    string,
    { ranges: vscode.Range[]; options: vscode.DecorationRenderOptions }
  >();

  for (const { color, backgroundColor, range } of decorations) {
    const key = `${color ?? ''}|${backgroundColor ?? ''}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        ranges: [],
        options: {
          color,
          backgroundColor,
          isWholeLine: true,
        },
      });
    }

    grouped.get(key)!.ranges.push(range);
  }

  // 3️⃣ Aplicar decoraciones
  const activeTypes: vscode.TextEditorDecorationType[] = [];

  for (const { options, ranges } of grouped.values()) {
    const decorationType = vscode.window.createTextEditorDecorationType(options);
    editor.setDecorations(decorationType, ranges);
    activeTypes.push(decorationType);
  }

  // 4️⃣ Guardar referencia para limpiar después
  activeDecorationsMap.set(docUri, activeTypes);
};

//#endregion


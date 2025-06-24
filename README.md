# color-suit-comments README

Color Suit Comments is a Visual Studio Code extension that allows you to add custom styles to code comments using configurable tags.

You can also create collapsible blocks by using matching opening and closing tags, making it easier to structure and navigate large files.

The extension works in real time, supports multi-file visualization, and can be fully customized via the `settings.json` file.

Currently compatible with JavaScript and TypeScript.

## Features

- Apply **custom styles** to code comments using configurable tags (text color and background). The available default tags are:

  <div style="color:#ff4d4f; background-color:#ff4d4f10">//#error</div>
  <div style="color:#ff4d4f; background-color:#ff4d4f10; margin-bottom:5px;">//#end-error</div>
  <div style="color:#ffff4f; background-color:#ffff4f10">//#warning</div>
  <div style="color:#ffff4f; background-color:#ffff4f10;  margin-bottom:5px;">//#end-warning</div>
  <div style="color:#ffa04f; background-color:#ffa04f10">//#todo</div>
  <div style="color:#ffa04f; background-color:#ffa04f10;  margin-bottom:5px;">//#end-todo</div>
  <div style="color:#4080f0; background-color:#4080f010">//#info</div>
  <div style="color:#4080f0; background-color:#4080f010">//#end-info</div>

- Define **collapsible blocks** using matching opening and closing tags.

  ![Presentation example](media/presentation-example.png)


- Easily access and edit the configuration via a dedicated **Edit Settings** menu option.
- Ships with a default set of tags, but you can **add, remove, or edit** them via `settings.json`.

  ![Opening settings.json](media/open-settings.gif)

- 🔀 Use the **Toggle Blocks** command to collapse or expand all tag-defined blocks with one click.

  ![Toggle collapse block example](media/colapse-blocks.gif)

- 🔁 Automatically updates **in real time** as you type.

  ![Decorate in real time](media/real-time-example.gif)

- 📁 Works across **multiple open files** simultaneously.

## Requirements

There are no additional requirements or dependencies needed to use this extension. It works out of the box.

## Extension Settings


This extension contributes the following setting:

- `colorSuitComments.tags`:  
  An array of tag definitions used to apply custom styles to comments.  
  Each tag can include:
  - `tag` (required): The name of the tag to match in comments.
  - `color`: The text color to apply.
  - `backgroundColor`: The background color for the block (if it becomes collapsible).

You can edit these settings directly via the command **"Edit tags"**, which opens your `settings.json` file.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**

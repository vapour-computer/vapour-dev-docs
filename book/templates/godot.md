# Godot template

<span class="badge badge-preview">Preview</span> <span class="badge">Godot 4</span>

From an empty Godot starter folder to a game on Vapour. If you have not yet, read the [templates overview](overview.md) first.

## 1. Make the folder

```sh
vapour login --token vpr_...
vapour template godot "My Game"
cd my-game
```

You now have an empty starter with your settings file and store page files.

## 2. Add your Godot game

You need **Godot 4** and its **web export templates** (in the editor: **Editor → Manage Export Templates**). The editor and the templates must be the same version.

Either:

- **Copy your existing Godot project** into this folder, or
- **Create a new project** in Godot, then copy `vapour.toml` and the `store` folder into it.

![The Godot 4.7 editor with the TPS demo open, showing the scene, the file list with our added vapour.toml, and the 3D view](../assets/img/godot-editor-project.png)

*The Godot editor, shown here with the sample game from the [Godot tutorial](../tutorials/godot.md).*

## 3. Set up the web export

Godot only exports what an export setting describes. Open **Project → Export…**

![The Godot Project menu open, with Export highlighted among Project Settings, Version Control, Pack Project as ZIP and others](../assets/img/godot-project-menu.png)

Click **Add…**, choose **Web**, and keep the name `Web`. Leave **Thread Support** off to begin with.

![The Godot export window with the Web preset selected, showing Extensions Support and Thread Support switched off](../assets/img/godot-export-dialog.png)

*The export window, from the sample game.*

> **Do not forget to keep the export setting in your project.** It is saved in a file called `export_presets.cfg`. Some Godot
> `.gitignore` files hide it, and then your build fails on other computers and in CI. The Godot template does not hide it.

## 4. Make the browser version

From the editor, **Export Project** into the `build/web` folder and name the file `index.html`. Or from the command line:

```sh
vapour build
```

## 5. Try it

```sh
vapour test
```

Your game opens in a browser with a live speed counter. See [Understand your game's performance](../telemetry/guide.md).

## 6. Publish

```sh
vapour publish --dry-run --version 0.1.0 --notes "Dry run"
vapour publish --version 0.1.0 --notes "First release"
```

The first command tells you the size and checks everything. The current upload limit is **512 MiB**, and a Godot game's data file is usually the biggest part.

## Want it to work on phones?

You can add on-screen sticks and buttons. The [Godot tutorial](../tutorials/godot.md) shows how, step by step, with a real game.

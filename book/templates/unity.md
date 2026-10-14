# Unity template

<span class="badge badge-preview">Preview</span> <span class="badge badge-warn">Not tested with a real Unity build</span> <span class="badge">Unity</span>

From an empty Unity starter folder to a game on Vapour. If you have not yet, read the [templates overview](overview.md) first.

> **Be aware:** we had no Unity editor or license when writing this, so this path has **not been run end to end**. The Vapour side was
> checked, the Unity side follows Unity's own documentation. If a step does not work, please tell us.

## 1. Make the folder

```sh
vapour login --token vpr_...
vapour template unity "My Game"
cd my-game
```

You now have a starter with your settings file, your store page files, and a small helper Vapour uses to build your game: `Assets/Editor/VapourBuild.cs`.

## 2. Add your Unity project

The template is not a Unity project. It is usually easiest to do this:

1. **Create your project in Unity Hub** (or open your existing one).
2. **Copy into it** the `vapour.toml` file, the `store` folder and `Assets/Editor/VapourBuild.cs` from the template folder.

Then in Unity:

- Open **File → Build Profiles** (older editors: **Build Settings**), pick the **Web** platform and click **Switch Platform**.
- **Add at least one scene** to the build. The helper stops with *"Enable at least one scene in Build Settings"* if there is none.
- If your game uses Unity's older input system, open **Edit → Project Settings → Player → Other Settings** and set **Active Input Handling** to **Input Manager (Old)** or **Both**.
- Set the compression to **Disabled** to begin with, which is the simplest first build.

The [Unity tutorial](../tutorials/unity.md) walks through all of this with a sample.

## 3. Make the browser version

Tell Vapour where your Unity editor is, then build:

```sh
export UNITY_EDITOR=/path/to/Unity/Editor/Unity
vapour build
```

You can also run it by hand from the Unity menu: **Vapour → Build**.

## 4. Try it

```sh
vapour test
```

See [Understand your game's performance](../telemetry/guide.md).

## 5. Publish

```sh
vapour publish --dry-run
vapour publish
```

Unity builds can be large. The upload limit is **512 MiB**, and `vapour build` warns you if big content should be split up.

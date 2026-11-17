<p align="center"><img src="icons/icon128.png" width="96" alt="Div Inspector icon"></p>

# Div Inspector

A Chrome extension for inspecting elements without a giant tooltip following your cursor around.

![Div Inspector demo](docs/demo.gif)

- Hover any element to get a dashed green outline, plus margin (orange) and padding (green) overlays.
- A small label shows the tag, classes, size, and the React/Vue component name.
- Press **S** for a docked details panel: box model, spacing, size, font, colors, border, layout, effects.
- Press **S** again to hide it.
- Press **Esc** to turn the inspector off.

## Install

1. Clone this repo.
2. Open `chrome://extensions` and turn on **Developer mode** (top-right).
3. Click **Load unpacked** and pick this folder.
4. Pin the icon.

## Use

| Action | What it does |
| --- | --- |
| Click icon / `Alt+Shift+D` | Toggle on/off |
| Hover | Highlight element |
| `S` | Show/hide details for the hovered element (locks it) |
| `Esc` | Turn off |

## Notes

- Component names show up best on dev builds. Production builds usually minify them.
- Chrome blocks extensions on `chrome://` pages and the Web Store.

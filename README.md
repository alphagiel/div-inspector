<p align="center"><img src="icons/icon128.png" width="96" alt="Div Inspector icon"></p>

# Div Inspector

A Chrome extension for inspecting elements without a giant tooltip following your cursor around.

![Div Inspector demo](docs/demo.gif)

- The icon shows a blue **ON** badge while the inspector is running on that tab.
- A small toast in the top-right lists the keys. Close it with **×**.
- Hover any element to get a dashed blue outline, plus margin (orange) and padding (green) overlays.
- If the element (or its parent) is a CSS grid, its cells show as purple dashed boxes and the label shows the grid size (e.g. `grid 3×2`).
- A small label shows the tag, classes, size, and the React/Vue component name.
- Press **S** for a docked details panel: box model, spacing, size, font, colors, border, layout, effects.
- Press **S** again to hide it.
- Press **C** to copy the hovered element for AI: selector, component chain, size, parent layout, non-default computed styles, and an HTML snippet as Markdown. Paste it into Claude/ChatGPT and ask for a fix.
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
| `C` | Copy the hovered element as an AI-ready prompt |
| `Esc` | Turn off |

## Notes

- Component names show up best on dev builds. Production builds usually minify them.
- Chrome blocks extensions on `chrome://` pages and the Web Store.

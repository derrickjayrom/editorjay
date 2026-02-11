# README: Anti-Gravity VS Code Interface Implementation

## 1. Executive Summary

This document provides the blueprint for tailoring an editor built on the **Anti-Gravity** framework to replicate the Visual Studio Code (VS Code) environment. This focuses on the "Dark+" aesthetic and the specific spatial layout of the workbench.

---

## 2. Interface Layout (The Workbench)

To achieve the VS Code look, the Anti-Gravity layout engine should be divided into five primary zones:

| Zone             | Role                   | Dimensions   | Color (Hex) |
| :--------------- | :--------------------- | :----------- | :---------- |
| **Activity Bar** | Navigation Icons       | 50px Width   | `#333333`   |
| **Side Bar**     | File Explorer / Search | 250px-300px  | `#252526`   |
| **Editor Group** | Primary Code Space     | Fluid        | `#1E1E1E`   |
| **Panel**        | Terminal / Console     | 200px Height | `#1E1E1E`   |
| **Status Bar**   | Metadata / Info        | 22px Height  | `#007ACC`   |

---

## 3. Visual Styling & Theming

### 3.1 Syntax Highlighting (Dark+)

Implement these core tokens within your Anti-Gravity theme engine:

- **Functions:** `#DCDCAA` (Pale Yellow)
- **Keywords:** `#C586C0` (Magenta)
- **Strings:** `#CE9178` (Salmon/Orange)
- **Comments:** `#6A9955` (Green)
- **Variables:** `#9CDCFE` (Light Blue)

### 3.2 Typography

- **Code Font:** `JetBrains Mono` or `Consolas`, 14px.
- **UI Font:** `Segoe UI` or `Inter`, 12px.
- **Letter Spacing:** `-0.2px` for UI elements.

---

## 4. Feature Implementation Steps

### Step 1: The Activity Bar

- Map vertical icons to your Anti-Gravity `View` state.
- The active icon should have a `2px` solid white border-left to indicate focus.

### Step 2: Tab Management

- Implement "Tab" components with a width of `120px` to `200px`.
- Active tabs should have a top border of `#007ACC` or a background matching the editor (`#1E1E1E`).

### Step 3: The Gutter

- The line number gutter should be background-matched to the editor.
- Active line numbers should be `#C6C6C6`, while inactive lines are `#858585`.

---

## 5. Required Assets

To ensure visual parity, the following asset libraries are recommended:

1.  **Icons:** [Codicons](https://github.com/microsoft/vscode-codicons) (Official VS Code Icon set).
2.  **File Icons:** [Seti UI](https://github.com/jesseweed/seti-ui) for file-type specific glyphs.

---

_Document generated for Anti-Gravity Framework Development - 2026_

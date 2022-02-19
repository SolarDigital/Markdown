/* eslint-disable no-cond-assign */
import {
  setBlockType,
  chainCommands,
  toggleMark,
  exitCode,
  selectParentNode
} from "prosemirror-commands";
import { wrapInList } from "prosemirror-schema-list";
import { undo, redo } from "prosemirror-history";
import { undoInputRule } from "prosemirror-inputrules";
import { goToNextCell } from "prosemirror-tables";

import { enterKeyHandler } from "./commands/enterKeyHandler";

const mac =
  typeof navigator !== "undefined" ? /Mac/.test(navigator.platform) : false;

// :: (Schema, ?Object) → Object
// Inspect the given schema looking for marks and nodes from the
// basic schema, and if found, add key bindings related to them.

// You can suppress or map these bindings by passing a `mapKeys`
// argument, which maps key names (say `"Mod-B"` to either `false`, to
// remove the binding, or a new key name string.
export function buildKeymap(schema, mapKeys) {
  const keys = {};
  let type;
  function bind(key, cmd) {
    if (mapKeys) {
      const mapped = mapKeys[key];
      if (mapped === false) return;
      if (mapped) key = mapped;
    }
    keys[key] = cmd;
  }

  bind("Tab", goToNextCell(1));
  bind("Shift-Tab", goToNextCell(-1));

  bind("Mod-z", undo);
  bind("Shift-Mod-z", redo);
  bind("Shift-Mod-z", redo);
  bind("Backspace", undoInputRule);

  if (!mac) bind("Mod-y", redo);

  bind("Escape", selectParentNode);

  if ((type = schema.marks.underline)) {
    bind("Mod-u", toggleMark(type));
  }

  if ((type = schema.marks.strong)) {
    bind("Mod-b", toggleMark(type));
    bind("Mod-B", toggleMark(type));
  }
  if ((type = schema.marks.em)) {
    bind("Mod-i", toggleMark(type));
    bind("Mod-I", toggleMark(type));
  }
  if ((type = schema.marks.code)) bind("Mod-`", toggleMark(type));

  if ((type = schema.nodes.bullet_list)) bind("Shift-Ctrl-8", wrapInList(type));
  if ((type = schema.nodes.ordered_list))
    bind("Shift-Ctrl-9", wrapInList(type));

  if ((type = schema.nodes.hard_break)) {
    const br = type;
    const cmd = chainCommands(exitCode, (state, dispatch) => {
      dispatch(state.tr.replaceSelectionWith(br.create()).scrollIntoView());
      return true;
    });
    bind("Mod-Enter", cmd);
    bind("Shift-Enter", cmd);
    if (mac) bind("Ctrl-Enter", cmd);
  }

  if ((type = schema.nodes.iframe)) {
    bind("Enter", enterKeyHandler(type));
  }

  if ((type = schema.nodes.code_block))
    bind("Shift-Ctrl-\\", setBlockType(type));

  if ((type = schema.nodes.heading))
    for (let i = 1; i <= 3; i++)
      bind(`Shift-Ctrl-${i}`, setBlockType(type, { level: i }));

  return keys;
}

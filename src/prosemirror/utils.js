import { wrapIn, lift, setBlockType } from "prosemirror-commands";

import { findParentNode, findSelectedNodeOfType } from "./prosemirror-utils";

export function nodeIsActive(state, type, attrs = {}) {
  const predicate = node => node.type === type;
  const node =
    findSelectedNodeOfType(type)(state.selection) ||
    findParentNode(predicate)(state.selection);

  if (!Object.keys(attrs).length || !node) {
    return !!node;
  }

  return node.node.hasMarkup(type, attrs);
}

export function toggleWrap(type) {
  return (state, dispatch, view) => {
    const isActive = nodeIsActive(state, type);

    if (isActive) {
      return lift(state, dispatch);
    }

    return wrapIn(type)(state, dispatch, view);
  };
}

export function toggleBlockType(type, toggletype, attrs = {}) {
  return (state, dispatch, view) => {
    const isActive = nodeIsActive(state, type, attrs);

    if (isActive) {
      return setBlockType(toggletype)(state, dispatch, view);
    }

    return setBlockType(type, attrs)(state, dispatch, view);
  };
}

export function getMarkAttrs(state, type) {
  const { from, to } = state.selection;
  let marks = [];

  state.doc.nodesBetween(from - 1, to + 1, node => {
    marks = [...marks, ...node.marks];
  });

  const mark = marks.find(markItem => markItem.type.name === type.name);

  if (mark) {
    return mark.attrs;
  }

  return {};
}

export function getMarkRange($pos = null, type = null) {
  if (!$pos || !type) {
    return false;
  }

  const start = $pos.parent.childAfter($pos.parentOffset);

  if (!start.node) {
    return false;
  }

  const link = start.node.marks.find(mark => mark.type === type);
  if (!link) {
    return false;
  }

  let startIndex = $pos.index();
  let startPos = $pos.start() + start.offset;
  let endIndex = startIndex + 1;
  let endPos = startPos + start.node.nodeSize;

  while (
    startIndex > 0 &&
    link.isInSet($pos.parent.child(startIndex - 1).marks)
  ) {
    startIndex -= 1;
    startPos -= $pos.parent.child(startIndex).nodeSize;
  }

  while (
    endIndex < $pos.parent.childCount &&
    link.isInSet($pos.parent.child(endIndex).marks)
  ) {
    endPos += $pos.parent.child(endIndex).nodeSize;
    endIndex += 1;
  }

  return { from: startPos, to: endPos };
}

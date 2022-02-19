import { splitListItem } from "prosemirror-schema-list";
import { nodeIsActive } from "../utils";

export function enterKeyHandler(type) {
  return (state, dispatch) => {
    const { nodeBefore, pos } = state.selection.$from;

    if (!nodeBefore || !nodeBefore.isText) {
      return false;
    }

    if (nodeIsActive(state, state.schema.nodes.list_item)) {
      splitListItem(state.schema.nodes.list_item)(state, dispatch);
      return true;
    }

    if (!state.selection.$cursor) {
      return false;
    }

    const matches = nodeBefore.text.match(
      /https?:\/\/(www\.)?(codepen.io)\/.+\/.+\/([^/]+)\/?$/
    );
    if (matches) {
      if (dispatch) {
        dispatch(
          state.tr.replaceWith(
            pos - nodeBefore.nodeSize,
            pos,
            type.create({ src: matches[0].replace("/pen/", "/embed/") })
          )
        );
      }
      return true;
    }
    return false;
  };
}

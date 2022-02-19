import { Plugin } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
// import { api } from "../api";

export const placeholderPlugin = new Plugin({
  state: {
    init() {
      return DecorationSet.empty;
    },
    apply(tr, set) {
      // Adjust decoration positions to changes made by the transaction
      set = set.map(tr.mapping, tr.doc);
      // See if the transaction adds or removes any placeholders
      const action = tr.getMeta(this);
      if (action && action.add) {
        const { blobFileUrl } = action;
        const widget = document.createElement("div");
        widget.className = "placeholder-image";
        const progressBar = document.createElement("div");
        progressBar.className = "spinner";

        const placeholderImage = document.createElement("img");
        placeholderImage.src = blobFileUrl;

        widget.appendChild(placeholderImage);
        widget.appendChild(progressBar);

        const deco = Decoration.widget(action.add.pos, widget, {
          id: action.add.id
        });
        set = set.add(tr.doc, [deco]);
      } else if (action && action.remove) {
        set = set.remove(
          set.find(null, null, spec => spec.id === action.remove.id)
        );
      }
      return set;
    }
  },
  props: {
    decorations(state) {
      return this.getState(state);
    }
  }
});

function findPlaceholder(state, id) {
  const decos = placeholderPlugin.getState(state);
  const found = decos.find(null, null, spec => spec.id === id);
  return found.length ? found[0].from : null;
}

export async function startImageUpload(view, file, schema) {
  // A fresh object to act as the ID for this upload
  const id = {};
  const blobFileUrl = window.URL.createObjectURL(file);
  // Replace the selection with a placeholder
  const { tr } = view.state;
  if (!tr.selection.empty) tr.deleteSelection();
  tr.setMeta(placeholderPlugin, {
    add: { id, pos: tr.selection.from },
    blobFileUrl
  });
  view.dispatch(tr);

  try {
    /* INSERT YOUR UPLOAD IMAGE API HERE */
    // const { url } = await api("/media/upload", {
    //   method: "POST",
    //   body: file
    // });
    const pos = findPlaceholder(view.state, id);
    // If the content around the placeholder has been deleted, drop
    // the image
    if (pos === null) return;
    // Otherwise, insert it at the placeholder's position, and remove
    // the placeholder
    const img = new Image();
    img.onload = () => {
      view.dispatch(
        view.state.tr
          .replaceWith(
            pos,
            pos,
            schema.nodes.image.create({
              src: url
            })
          )
          .setMeta(placeholderPlugin, { remove: { id } })
      );
    };
    img.src = url;
  } catch (err) {
    view.dispatch(tr.setMeta(placeholderPlugin, { remove: { id } }));
  }
}

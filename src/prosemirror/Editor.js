import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Node, DOMSerializer } from "prosemirror-model";

import { mySchema } from "./schema";
import { setupPlugins } from "./plugins";

export class Editor {
  constructor(options = {}) {
    this.view = new EditorView(document.getElementById("editor"), {
      state: EditorState.create({
        schema: mySchema,
        plugins: setupPlugins({ schema: mySchema }),
        ...options
      })
    });
  }

  get json() {
    return this.view.state.doc.toJSON();
  }

  static mySchema = mySchema;

  static renderArticle(jsonArticle) {
    const contentNode = Node.fromJSON(mySchema, jsonArticle);

    DOMSerializer.fromSchema(mySchema).serializeFragment(
      contentNode.content,
      { document: window.document },
      document.getElementById("editor")
    );
  }
}

/* eslint-disable guard-for-in */
/* eslint-disable max-classes-per-file */
/* eslint-disable no-cond-assign */
import { toggleMark } from "prosemirror-commands";
import { Plugin, TextSelection } from "prosemirror-state";
import {
  addColumnAfter,
  deleteColumn,
  addRowAfter,
  deleteRow,
  deleteTable
} from "prosemirror-tables";
import { createTable } from "./prosemirror-utils";
import { toggleWrap, nodeIsActive, toggleBlockType } from "./utils";
import toggleList from "./commands/toggleList";

const prefix = "st";

// Work around classList.toggle being broken in IE11
function setClass(dom, cls, on) {
  if (on) dom.classList.add(cls);
  else dom.classList.remove(cls);
}

function createIconBtn(id, iconClass = "") {
  const button = document.createElement("button");
  button.className = "svg-btn";
  button.innerHTML = `<svg
                          xmlns="http://www.w3.org/2000/svg"
                          xmlnsXlink="http://www.w3.org/1999/xlink"
                          class="${iconClass} svg-icon">
                        <use xlink:href="#${id}" />
                      </svg>`;
  return button;
}
export class MenuItem {
  constructor(spec) {
    // The spec used to create the menu item.
    this.spec = spec;
  }

  // :: (EditorView) → {dom: dom.Node, update: (EditorState) → bool}
  // Renders the icon according to its [display
  // spec](#menu.MenuItemSpec.display), and adds an event handler which
  // executes the command when the representation is clicked.
  render(view) {
    const { spec } = this;

    const dom = spec.icon ? createIconBtn(spec.icon, spec.iconClass) : null;

    if (!dom) throw new RangeError("MenuItem without icon or label property");

    dom.addEventListener("click", e => {
      e.preventDefault();
      spec.run(view.state, view.dispatch, view, e);
    });

    function update(state) {
      if (spec.select) {
        const selected = spec.select(state);
        dom.style.display = selected ? "" : "none";
        if (!selected) return false;
      }

      if (spec.active) {
        const active = spec.active(state) || false;
        setClass(dom, "active", active);
      }
      return true;
    }

    return { dom, update };
  }
}

function cmdItem(cmd, options) {
  const passedOptions = {
    run: cmd
  };
  for (const prop in options) passedOptions[prop] = options[prop];
  if ((!options.enable || options.enable === true) && !options.select)
    passedOptions[options.enable ? "enable" : "select"] = state => cmd(state);

  return new MenuItem(passedOptions);
}

function markActive(state, type) {
  const { from, $from, to, empty } = state.selection;
  if (empty) return type.isInSet(state.storedMarks || $from.marks());
  return state.doc.rangeHasMark(from, to, type);
}

function markItem(markType, options) {
  const passedOptions = {
    active(state) {
      return markActive(state, markType);
    },
    enable: true
  };
  for (const prop in options) passedOptions[prop] = options[prop];
  return cmdItem(toggleMark(markType), passedOptions);
}

export function blockTypeItem(nodeType, paragraph, options) {
  const passedOptions = {
    run(state, dispatch, view) {
      toggleBlockType(nodeType, paragraph, options.attrs)(
        state,
        dispatch,
        view
      );
    },
    active(state) {
      const { $from, to, node } = state.selection;
      if (node) return node.hasMarkup(nodeType, options.attrs);
      return (
        to <= $from.end() && $from.parent.hasMarkup(nodeType, options.attrs)
      );
    }
  };

  // eslint-disable-next-line guard-for-in
  for (const prop in options) passedOptions[prop] = options[prop];

  return new MenuItem(passedOptions);
}

export function wrapItem(nodeType, options) {
  const passedOptions = {
    run(state, dispatch, view) {
      toggleWrap(nodeType)(state, dispatch, view);
    }
  };
  for (const prop in options) passedOptions[prop] = options[prop];
  return new MenuItem(passedOptions);
}

function wrapListItem(nodeType, itemType, options) {
  const passedOptions = {
    active(state) {
      return nodeIsActive(state, nodeType);
    }
  };
  for (const prop in options) passedOptions[prop] = options[prop];
  return cmdItem(toggleList(nodeType, itemType, options.attrs), passedOptions);
}

function tableItem(nodeType, options) {
  const passedOptions = {
    select(state) {
      return nodeIsActive(state, nodeType);
    }
  };
  for (const prop in options) passedOptions[prop] = options[prop];
  return new MenuItem(passedOptions);
}

const buildTable = (schema, { rowsCount, colsCount, withHeaderRow }) => (
  state,
  dispatch
) => {
  const offset = state.tr.selection.anchor + 1;
  const nodes = createTable(schema, rowsCount, colsCount, withHeaderRow);
  const tr = state.tr.replaceSelectionWith(nodes).scrollIntoView();
  const resolvedPos = tr.doc.resolve(offset);

  tr.setSelection(TextSelection.near(resolvedPos));
  dispatch(tr);
};

const TABLE_ITEMS = [
  { icon: "add-column", run: addColumnAfter },
  { icon: "remove-column", run: deleteColumn },
  { icon: "add-row", run: addRowAfter },
  { icon: "remove-row", run: deleteRow },
  { icon: "remove-table", run: deleteTable }
];

export function buildTableMenuItems(schema) {
  const r = [];
  let type;
  if ((type = schema.nodes.table)) {
    TABLE_ITEMS.forEach(item => r.push(tableItem(type, item)));
  }

  return r;
}

export function buildMenuItems(schema) {
  const r = [];
  let type;

  if ((type = schema.nodes.heading)) {
    for (let i = 1; i <= 3; i++)
      r.push(
        blockTypeItem(type, schema.nodes.paragraph, {
          icon: `header-${i}`,
          attrs: { level: i }
        })
      );
  }

  if ((type = schema.nodes.code_block)) {
    r.push(
      blockTypeItem(type, schema.nodes.paragraph, {
        icon: "code-block"
      })
    );
  }

  if ((type = schema.nodes.blockquote)) {
    r.push(
      wrapItem(type, {
        icon: "block-quote"
      })
    );
  }

  if ((type = schema.marks.code)) {
    r.push(
      markItem(type, {
        icon: "inline-code",
        iconClass: "wider"
      })
    );
  }

  if ((type = schema.nodes.bullet_list)) {
    r.push(
      wrapListItem(type, schema.nodes.list_item, {
        icon: "bullet-list"
      })
    );
  }

  if ((type = schema.nodes.ordered_list)) {
    r.push(
      wrapListItem(type, schema.nodes.list_item, {
        icon: "ordered-list"
      })
    );
  }

  if ((type = schema.nodes.table)) {
    r.push(
      new MenuItem({
        icon: "table",
        run: buildTable(schema, {
          rowsCount: 3,
          colsCount: 2,
          withHeaderRow: true
        })
      })
    );
  }

  return r;
}

export function renderMenuBars(view, main, table) {
  const mainMenuItems = document.createDocumentFragment();
  const tableMenuItems = document.createDocumentFragment();
  const updates = [];

  for (let i = 0; i < main.length; i++) {
    // eslint-disable-next-line no-shadow
    const { dom, update } = main[i].render(view);
    mainMenuItems.appendChild(dom);
    updates.push(update);
  }

  for (let i = 0; i < table.length; i++) {
    // eslint-disable-next-line no-shadow
    const { dom, update } = table[i].render(view);
    tableMenuItems.appendChild(dom);
    updates.push(update);
  }

  function update(state) {
    let something = false;
    for (let i = 0; i < updates.length; i++) {
      const hasContent = updates[i](state);
      if (hasContent) something = true;
    }
    return something;
  }
  return { mainMenuItems, tableMenuItems, update };
}

class MenuBarView {
  constructor(editorView, options) {
    const { main, table } = options;

    const menuContainer = document.createElement("div");
    menuContainer.setAttribute("style", "position:sticky;top:70px;");

    // eslint-disable-next-line no-shadow
    const menuBar = document.createElement("div");
    menuBar.className = `${prefix}-menubar`;

    const mainMenuBar = document.createElement("div");
    mainMenuBar.className = `${prefix}-main-bar flex`;

    const tableMenuBar = document.createElement("div");
    tableMenuBar.className = `${prefix}-tbl-bar flex`;

    const { mainMenuItems, tableMenuItems, update } = renderMenuBars(
      editorView,
      main,
      table
    );

    mainMenuBar.appendChild(mainMenuItems);
    tableMenuBar.appendChild(tableMenuItems);

    menuBar.appendChild(mainMenuBar);
    menuBar.appendChild(tableMenuBar);
    menuContainer.appendChild(menuBar);

    editorView.dom.parentNode.prepend(menuContainer);

    this.editorView = editorView;
    this.contentUpdate = update;
    this.menuBar = menuContainer;

    this.update();
  }

  update() {
    this.contentUpdate(this.editorView.state);
  }

  destroy() {
    if (this.editorView.dom.parentNode) {
      this.editorView.dom.parentNode.replaceChild(
        this.editorView.dom,
        this.menuBar
      );
    }
  }
}

export function menuBar(options) {
  return new Plugin({
    view(editorView) {
      return new MenuBarView(editorView, options);
    }
  });
}
/* eslint-enable no-cond-assign */

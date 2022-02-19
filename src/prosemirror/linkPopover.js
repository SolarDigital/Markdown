import { updateMark } from "./commands/updateMark";
import { getMarkAttrs } from "./utils";

function buttonIconTemplate(svgId) {
  return `<svg
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            width="24" height="24" fill="#fff">
          <use href="#${svgId}" />
        </svg>`;
}

export class LinkPopUp {
  constructor(view) {
    const tooltip = document.createElement("form");
    tooltip.className = "tooltip link js-change-link";
    tooltip.addEventListener("submit", this.changeLink.bind(this));

    const input = document.createElement("input");
    input.setAttribute("type", "hidden");

    const anchor = document.createElement("a");
    anchor.setAttribute("rel", "noopener noreferrer");
    anchor.setAttribute("target", "_blank");

    const button = document.createElement("button");
    button.className = "flex-y-center";
    button.setAttribute("type", "submit");
    button.innerHTML = buttonIconTemplate("close");

    tooltip.appendChild(input);
    tooltip.appendChild(anchor);
    tooltip.appendChild(button);

    view.dom.parentNode.appendChild(tooltip);

    this.button = button;
    this.input = input;
    this.anchor = anchor;
    this.tooltip = tooltip;

    this.update(view, null);
  }

  changeLink(e) {
    e.preventDefault();

    // user has clicked to update link
    if (e.target.classList.contains("js-change-link")) {
      this.anchor.setAttribute("hidden", true);
      this.input.value = this.href;
      this.input.setAttribute("type", "text");
      this.input.select();
      e.target.classList.replace("js-change-link", "js-update-link");
      this.button.innerHTML = buttonIconTemplate("check");
      return;
    }

    const { state, dispatch } = this.view;
    updateMark(state.schema.marks.link, { href: this.input.value })(
      state,
      dispatch
    );

    this.input.setAttribute("type", "hidden");
    this.anchor.removeAttribute("hidden");
    this.button.innerHTML = buttonIconTemplate("close");
    e.target.classList.replace("js-update-link", "js-change-link");
  }

  update(view, lastState) {
    const { state } = view;
    // Don't do anything if the document/selection didn't change
    if (
      lastState &&
      lastState.doc.eq(state.doc) &&
      lastState.selection.eq(state.selection)
    )
      return;

    const { schema } = state;
    const { href } = getMarkAttrs(state, schema.marks.link);

    if (!href) {
      this.tooltip.style.display = "none";
      return;
    }

    this.view = view;
    this.href = href;

    // Otherwise, reposition it and update its content
    this.tooltip.style.display = "";
    const { from, to } = state.selection;
    // These are in screen coordinates
    const start = view.coordsAtPos(from);
    const end = view.coordsAtPos(to);
    // The box in which the tooltip is positioned, to use as base
    const box = this.tooltip.offsetParent.getBoundingClientRect();
    // Find a center-ish x position from the selection endpoints (when
    // crossing lines, end may be more to the left)
    const left = Math.max((start.left + end.left) / 2, start.left + 3);
    this.tooltip.style.left = `${left - box.left}px`;
    this.tooltip.style.bottom = `${box.bottom - start.top}px`;
    this.tooltip.classList.replace("js-update-link", "js-change-link");

    this.input.setAttribute("type", "hidden");
    this.anchor.href = href;
    this.anchor.innerHTML = href;
    this.anchor.removeAttribute("hidden");
  }

  destroy() {
    this.tooltip.remove();
  }
}

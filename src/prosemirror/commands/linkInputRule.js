import { InputRule } from "prosemirror-inputrules";

export function linkInputRule(regexp, markType, getAttrs) {
  return new InputRule(regexp, (state, match, start, end) => {
    const attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;
    attrs.rel = "noopener noreferrer nofollow";
    const { tr } = state;

    const title = match[1];
    const href = match[2];

    if (title && href) {
      tr.insertText(title, start, start + title.length)
        .delete(start + title.length, end)
        .insertText(" ", start + title.length)
        .addMark(start, start + title.length, markType.create(attrs));
    }

    return tr;
  });
}

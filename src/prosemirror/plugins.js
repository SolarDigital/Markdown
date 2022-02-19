/* eslint-disable no-shadow */
/* eslint-disable no-cond-assign */
import {
  inputRules,
  wrappingInputRule,
  textblockTypeInputRule,
  emDash
} from "prosemirror-inputrules";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import { history } from "prosemirror-history";
import { dropCursor } from "prosemirror-dropcursor";
import { gapCursor } from "prosemirror-gapcursor";
import { Plugin } from "prosemirror-state";
import { tableEditing } from "prosemirror-tables";
import { markInputRule } from "./commands/markInputRule";
import { menuBar, buildMenuItems, buildTableMenuItems } from "./menu";
import { nodeInputRule } from "./commands/nodeInputRule";
import { buildKeymap } from "./keymap";
import { linkInputRule } from "./commands/linkInputRule";
import { pasteRule } from "./commands/pasteRule";
import { LinkPopUp } from "./linkPopover";
import { placeholderPlugin, startImageUpload } from "./uploadImage.plugin";

export function blockQuoteRule(nodeType) {
  return wrappingInputRule(/^\s*>\s$/, nodeType);
}

export function bulletListRule(nodeType) {
  return wrappingInputRule(/^\s*([-+*])\s$/, nodeType);
}

export function orderedListRule(nodeType) {
  return wrappingInputRule(
    /^(\d+)\.\s$/,
    nodeType,
    match => ({ order: +match[1] }),
    (match, node) => node.childCount + node.attrs.order === +match[1]
  );
}

export function headingRule(nodeType, maxLevel) {
  return textblockTypeInputRule(
    new RegExp(`^(#{1,${maxLevel}})\\s$`),
    nodeType,
    match => ({ level: match[1].length })
  );
}

export function codeBlockRule(nodeType) {
  return textblockTypeInputRule(/^```$/, nodeType);
}

export function horizontalRule(nodeType) {
  return nodeInputRule(/^(?:—-|___\s|\*\*\*\s)$/, nodeType);
}

function imageRule(nodeType) {
  return nodeInputRule(
    /!\[(.+|:?)\]\((\S+)(?:\s+)(?:["'])(.+)(?:["'])\)/,
    nodeType,
    match => {
      const [, alt, src, title] = match;
      return {
        src,
        alt,
        title
      };
    }
  );
}

function linkPasteRule(nodeType) {
  return pasteRule(
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-zA-Z]{2,}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g,
    nodeType,
    url => ({ href: url })
  );
}

function buildPasteRules(schema) {
  return [linkPasteRule(schema.marks.link)];
}

function buildInputRules(schema) {
  const rules = [];
  rules.push(emDash);
  let type;
  if ((type = schema.nodes.blockquote)) rules.push(blockQuoteRule(type));
  if ((type = schema.nodes.horizontal_rule)) rules.push(horizontalRule(type));
  if ((type = schema.nodes.ordered_list)) rules.push(orderedListRule(type));
  if ((type = schema.nodes.bullet_list)) rules.push(bulletListRule(type));
  if ((type = schema.nodes.code_block)) rules.push(codeBlockRule(type));
  if ((type = schema.nodes.heading)) rules.push(headingRule(type, 3));
  if ((type = schema.marks.code)) {
    rules.push(markInputRule(/(?:`)([^`]+)(?:`)$/, type));
  }
  if ((type = schema.nodes.image)) {
    rules.push(imageRule(type));
  }
  if ((type = schema.marks.link)) {
    rules.push(
      linkInputRule(
        /(?:\[)(.+)(?:\])(?:\()(.+)(?:\))/,
        type,
        ([, title, href]) => ({ title, href })
      )
    );
  }
  return inputRules({ rules });
}

function handleImage({ event, accessKey, editorView }) {
  const hasFiles =
    event[accessKey] && event[accessKey].files && event[accessKey].files.length;

  if (!hasFiles) {
    return;
  }

  const images = Array.from(event[accessKey].files).filter(file =>
    /image/i.test(file.type)
  );

  if (images.length === 0) {
    return;
  }

  event.preventDefault();

  const { schema } = editorView.state;

  images.forEach(async image => {
    startImageUpload(editorView, image, schema);
  });
}

export function setupPlugins({ schema }) {
  const plugins = [
    buildInputRules(schema),
    ...buildPasteRules(schema),
    history(),
    keymap(buildKeymap(schema)),
    keymap(baseKeymap),
    menuBar({
      main: buildMenuItems(schema),
      table: buildTableMenuItems(schema)
    }),
    dropCursor(),
    gapCursor(),
    placeholderPlugin,
    new Plugin({
      view(editorView) {
        return new LinkPopUp(editorView);
      }
    }),
    new Plugin({
      props: {
        handleDOMEvents: {
          paste(view, event) {
            handleImage({
              event,
              editorView: view,
              accessKey: "clipboardData"
            });
          },
          drop(view, event) {
            handleImage({ event, editorView: view, accessKey: "dataTransfer" });
          }
        }
      }
    }),
    tableEditing()
  ];
  return plugins;
}

/* eslint-enable no-cond-assign */

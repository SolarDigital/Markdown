import { schema } from "prosemirror-schema-basic";
import { Schema } from "prosemirror-model";
import { addListNodes } from "prosemirror-schema-list";
import { tableNodes } from "prosemirror-tables";

export const mySchema = new Schema({
  nodes: addListNodes(
    schema.spec.nodes.append({
      ...tableNodes({
        tableGroup: "block",
        cellContent: "block+",
        cellAttributes: {
          background: {
            default: null,
            getFromDOM(dom) {
              return dom.style.backgroundColor || null;
            },
            setDOMAttr(value, attrs) {
              if (value)
                attrs.style = `${attrs.style || ""}background-color: ${value};`;
            }
          }
        }
      }),
      iframe: {
        attrs: {
          src: {
            default: null
          }
        },
        group: "block",
        selectable: false,
        parseDOM: [
          {
            tag: "iframe",
            getAttrs: dom => ({
              src: dom.getAttribute("src")
            })
          }
        ],
        toDOM: node => [
          "div",
          { class: "iframe-cont" },
          [
            "iframe",
            {
              src: node.attrs.src,
              frameborder: 0,
              allowfullscreen: "true",
              // style: "width: 100%;height: 100%",
              allowtransparency: "true"
            }
          ]
        ]
      }
    }),
    "paragraph block*",
    "block"
  ),
  marks: schema.spec.marks.remove("link").append({
    link: {
      attrs: {
        href: {},
        title: { default: null }
      },
      inclusive: false,
      parseDOM: [
        {
          tag: "a[href]",
          getAttrs(dom) {
            return {
              href: dom.getAttribute("href"),
              title: dom.getAttribute("title")
            };
          }
        }
      ],
      toDOM(node) {
        return ["a", { ...node.attrs, rel: "noopener noreferrer nofollow" }, 0];
      }
    },
    underline: {
      parseDOM: [
        {
          tag: "u"
        },
        {
          style: "text-decoration",
          getAttrs: value => value === "underline"
        }
      ],
      toDOM: () => ["u", 0]
    }
  })
});

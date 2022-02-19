import React, { Component } from "react";
import ReactDOM from "react-dom";
import { Editor } from "./prosemirror/Editor";
import "./styles.css";

class Hello extends Component {
  componentDidMount() {
    this.editor = new Editor();
  }

  saveArticle = async () => {
    console.log(this.editor.json);
  };

  render() {
    return (
      <div>
        <button
          style={{ background: "#ccc" }}
          type="button"
          onClick={this.saveArticle}
        >
          Export article
        </button>
        <div id="editor">
          <h1>hello</h1>
          <h2>hello</h2>
          <h3>hello</h3>
          <p>
            <code>hello</code>
          </p>
          <pre>
            <code>hello</code>
          </pre>
          <blockquote>
            <p>hello</p>
          </blockquote>
          <ol>
            <li>
              <p>hello</p>
            </li>
            <li>
              <p>hello</p>
            </li>
          </ol>
          <ul>
            <li>
              <p>hello </p>
            </li>
          </ul>
        </div>
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<Hello />, rootElement);

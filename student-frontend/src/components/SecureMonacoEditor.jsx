import { useCallback, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";

function SecureMonacoEditor({ language, value, onChange }) {
  const hostRef = useRef(null);
  const editorRef = useRef(null);
  const internalClipboardRef = useRef("");

  const getSelectionRange = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return null;

    const selection = editor.getSelection();
    if (!selection || selection.isEmpty()) return null;
    return selection;
  }, []);

  const copySelection = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const model = editor.getModel();
    const selection = getSelectionRange();
    if (!model || !selection) return;
    internalClipboardRef.current = model.getValueInRange(selection);
  }, [getSelectionRange]);

  const cutSelection = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const model = editor.getModel();
    const selection = getSelectionRange();
    if (!model || !selection) return;

    internalClipboardRef.current = model.getValueInRange(selection);
    editor.executeEdits("secure-cut", [{ range: selection, text: "" }]);
  }, [getSelectionRange]);

  const pasteSelection = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const text = internalClipboardRef.current;
    if (!text) return;

    const selection = editor.getSelection();
    if (!selection) return;
    editor.executeEdits("secure-paste", [{ range: selection, text }]);
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const onKeyDownCapture = (event) => {
      const key = event.key.toLowerCase();
      const isCtrlMeta = event.ctrlKey || event.metaKey;
      const isCopy = (isCtrlMeta && key === "c") || (event.ctrlKey && key === "insert");
      const isCut = isCtrlMeta && key === "x";
      const isPaste = (isCtrlMeta && key === "v") || (event.shiftKey && key === "insert");

      if (isCopy) {
        event.preventDefault();
        copySelection();
        return;
      }
      if (isCut) {
        event.preventDefault();
        cutSelection();
        return;
      }
      if (isPaste) {
        event.preventDefault();
        pasteSelection();
      }
    };

    host.addEventListener("keydown", onKeyDownCapture, true);
    return () => {
      host.removeEventListener("keydown", onKeyDownCapture, true);
    };
  }, [copySelection, cutSelection, pasteSelection]);

  return (
    <div ref={hostRef} className="code-editor-host" data-editor-host="true">
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={(next) => onChange(next ?? "")}
        theme="vs"
        onMount={(editor) => {
          editorRef.current = editor;
        }}
        options={{
          automaticLayout: true,
          minimap: { enabled: false },
          fontFamily: "JetBrains Mono, Fira Code, Consolas, monospace",
          fontSize: 14,
          lineHeight: 21,
          lineNumbers: "on",
          roundedSelection: false,
          scrollBeyondLastLine: false,
          contextmenu: false,
          copyWithSyntaxHighlighting: false,
          emptySelectionClipboard: false,
          tabSize: 2,
          insertSpaces: true,
          formatOnPaste: false,
          formatOnType: false,
          padding: { top: 12, bottom: 12 },
        }}
      />
    </div>
  );
}

export default SecureMonacoEditor;

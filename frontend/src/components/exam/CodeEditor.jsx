import Editor from "@monaco-editor/react";

function CodeEditor({
  code,
  onChange,
  language = "c",
  readOnly = false
}) {
  return (
    <Editor
      height="100%"
      theme="vs"        // ✅ LIGHT THEME
      language={language}
      value={code}
      onChange={onChange}
      options={{
        readOnly,
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: "on",
        lineNumbers: "on",
        cursorBlinking: "smooth",
        renderLineHighlight: "all"
      }}
    />
  );
}

export default CodeEditor;

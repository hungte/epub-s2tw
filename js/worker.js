importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

// derived from:
//   await pyodide.loadPackage("micropip");
//   const micropip = pyodide.pyimport("micropip");
//   await micropip.install("opencc-python-reimplemented");
pkgs = [
    "./packages/opencc_python_reimplemented-0.1.7-py2.py3-none-any.whl",
];

let pyodide;
async function initWorker() {
    pyodide = await loadPyodide();
    await pyodide.loadPackage(pkgs);
    self.postMessage({ type: 'READY' });
}

self.onmessage = async (e) => {
    if (e.data.type === 'CONVERT') {
        const { fileArrayBuffer, fileName, v2h, pythonCode } = e.data;

        try {
            self.postMessage({ type: 'STATUS', msg: '正在處理中...' });

            pyodide.globals.set("epub_bytes", fileArrayBuffer);
            pyodide.globals.set("epub_v2h", v2h);

            const pyProxy = await pyodide.runPythonAsync(pythonCode);
            const finalData = pyProxy.toJs();
            pyProxy.destroy();
            const outputBytes = new Blob([finalData], { type: 'application/epub+zip' });
            // defer to outside worker (app.js).
            self.postMessage({ type: 'DONE', data: outputBytes, name: fileName });
        } catch (err) {
            self.postMessage({ type: 'ERROR', msg: err.toString() });
        }
    }
};

initWorker();

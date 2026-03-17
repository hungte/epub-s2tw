
// Global Variables
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
let deferredPrompt;

function show(e) {
    e.classList.toggle('hidden', false);
}
function hide(e) {
    e.classList.toggle('hidden', true);
}

async function getPythonCode() {
    try {
        const response = await fetch('epub-s2tw_web.py');
        const code = await response.text();
        return code;
    } catch (err) {
        console.error("讀取 Python 檔案失敗:", err);
    }
}

async function init() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js');
    }

    const mainBtn = document.getElementById('mainBtn');
    const status = document.getElementById('status');
    const fileInput = document.getElementById('fileInput');
    const iosGuide = document.getElementById('iosGuide');

    if (true) {// isIOS && !isStandalone) {
        show(iosGuide);
    }

    // PWA installation
    document.getElementById('pwa-install-btn').addEventListener('click', handleInstallClick);
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      showInstallPromotion();
    });


    // 建立 Web Worker
    const worker = new Worker('worker.js');

    worker.onmessage = (e) => {
        const type = e.data.type;
        if (type === 'READY') {
            status.textContent = "準備就緒";
            mainBtn.disabled = false;
            mainBtn.textContent = "選擇 EPUB 檔案";
        } else if (type === 'DONE') {
            const blob = new Blob([e.data.data], {type: 'application/epub+zip'});
            const url = URL.createObjectURL(blob);
            let a = document.createElement('a');
            a.href = url;
            a.download = e.data.name.replace('.epub', '_繁體.epub');
            a.click();
            status.textContent = "轉換完成！已自動下載";
            mainBtn.disabled = false;
            a = null;
            URL.revokeObjectURL(url);
        } else if (type === 'STATUS') {
            status.textContent = e.data.msg;
            mainBtn.disabled = true;
        } else if (type === 'ERROR') {
            status.textContent = '錯誤: ' + e.data.msg;
            mainBtn.disabled = false;
        }
    };

    mainBtn.onclick = () => fileInput.click();
    let pythonCode = await getPythonCode();

    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file)
            return;
        mainBtn.disabled = true;
        status.textContent = '正在轉換，請勿關閉視窗...';
        const reader = new FileReader();
        reader.onload = (e) => {
            worker.postMessage({
                type: 'CONVERT',
                fileArrayBuffer: e.target.result,
                fileName: file.name,
                v2h: document.getElementById('chkV2H').checked,
                pythonCode,
            });
        };
        reader.readAsArrayBuffer(file);
    };
}


function handleInstallClick() {
  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      deferredPrompt = null;
    });
  } else if (isIOS()) {
    showIosInstallInstructions();
  }
}

function showInstallPromotion() {
  const installBtn = document.getElementById('pwa-install-btn');
  if (!isStandalone) {
    show(installBtn);
  }
}

// 修改之前的 showIosInstallInstructions 以顯示 HTML 元素
function showIosInstallInstructions() {
    const iosGuide = document.getElementById('ios-guide');
    if (iosGuide) {
        show(iosGuide);
        setTimeout(() => { hide(iosGuide); }, 8000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    init();
});

/* vim:et:set sw=4: */

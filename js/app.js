// Global Variables
let deferredPrompt;
const log = console.log

// Simple Utilities

function show(e) {
    e.classList.toggle('hidden', false);
}
function hide(e) {
    e.classList.toggle('hidden', true);
}

// PWA Application

function isInAppBrowser() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    return (ua.indexOf("FBAN") > -1) || (ua.indexOf("FBAV") > -1) || (ua.indexOf("Line") > -1);
}

function showIosGuide(ua) {
    const iosGuide = document.getElementById('iosGuide');
    const safariStep = document.getElementById('guide-safari');
    const chromeStep = document.getElementById('guide-chrome');
    if (ua.includes('CriOS')) {
        show(chromeStep);
    } else {
        show(safariStep);
    }
    show(iosGuide);
}

function closeInstallGuide() {
    const guide = document.getElementById('installGuide');
    hide(guide);
}

async function initInstallGuide() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    if (isStandalone) {
        log('Running in standalone mode');
        return;
    }

    const guide = document.getElementById('installGuide');
    const ua = window.navigator.userAgent;

    let isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;

    if (isIOS) {
        showIosGuide(ua);
        show(guide);
        return;
    }

    const inst_btn = document.getElementById('pwa-install-btn');
    if (!('onbeforeinstallprompt' in window)) {
        // No WPA, and not iOS.
        return;
    }

    // PWA installation
    inst_btn.addEventListener('click', handleInstallClick);
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
    });
    show(inst_btn);
    show(guide);
}

function handleInstallClick() {
    if (!deferredPrompt)
        return;
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            log('User accepted the install prompt');
        } else {
            log('User dismissed the install prompt');
        }
            deferredPrompt = null;
        });
}

// 修改之前的 showIosInstallInstructions 以顯示 HTML 元素
function showIosInstallInstructions() {
    const iosGuide = document.getElementById('ios-guide');
    if (iosGuide) {
        show(iosGuide);
        setTimeout(() => { hide(iosGuide); }, 8000);
    }
}


// Main Application

async function getPythonCode() {
    try {
        const response = await fetch('./epub-s2tw.py');
        const code = await response.text();
        return code;
    } catch (err) {
        console.error("讀取 Python 檔案失敗:", err);
    }
}

function initServiceWorker() {
    if (!('serviceWorker' in navigator))
        return;
    let refreshing = false;

    // 1. 監聽控制權變更，當 SW skipWaiting 成功後會觸發
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing)
            return;
        log("SW: ready to reload...");
        refreshing = true;
        window.location.reload();
    });

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .catch(err => console.error('SW 註冊失敗:', err));
    });
}

async function initPythonWorker() {
    const mainBtn = document.getElementById('mainBtn');
    const status = document.getElementById('status');
    const fileInput = document.getElementById('fileInput');

    // 建立 Web Worker
    const worker = new Worker('./js/worker.js');

    worker.onmessage = (e) => {
        const type = e.data.type;
        if (type === 'READY') {
            status.textContent = "準備就緒";
            mainBtn.disabled = false;
            mainBtn.textContent = "選擇 EPUB 檔案";
            initInstallGuide();
        } else if (type === 'DONE') {
            const blob = new Blob([e.data.data], {type: 'application/epub+zip'});
            const url = URL.createObjectURL(blob);
            let a = document.createElement('a');
            const dest = getDestLangExt();
            a.href = url;
            a.download = e.data.name.replace('.epub', `${dest}.epub`);
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

    mainBtn.onclick = () => {
        fileInput.value = '';
        fileInput.click();
    }

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
                cc: getOpenCCConfig(),
                pythonCode,
            });
        };
        reader.readAsArrayBuffer(file);
    };
}

function initOptions() {
    document.getElementById('swap-btn').onclick = () => {
        const src = document.getElementById('src-lang');
        const dest = document.getElementById('dest-lang');
        const temp = src.value;
        src.value = dest.value;
        dest.value = temp;
    };
}

function getDestLangExt() {
    const dest = document.getElementById('dest-lang').value;

    switch (dest) {
        case 's':
            return '.chs';
        case 'tw':
            return '.tw';
        case 'hk':
            return '.hk';
        case 't':
        default:
            return '.cht';
    }
}

function getOpenCCConfig() {
    const src = document.getElementById('src-lang').value;
    const dest = document.getElementById('dest-lang').value;

    // 預設常見組合，如果來源目標相同則不轉換
    if (src === dest) return null;

    // OpenCC 命名規則通常是 [src]2[dest]
    // 注意：某些組合需要手動對應，例如 s2twp 代表簡體轉台灣正體（含慣用語）
    let config = `${src}2${dest}`;

    // 特殊處理：台灣正體通常建議用 s2twp (帶詞彙修正)
    if (src === 's' && dest === 'tw') config = 's2twp';
    // if (src === 'tw' && dest === 's') config = 'tw2s';

    console.log(`Selected OpenCC config: ${config}`);
    return `${config}`;
}

function checkInAppBrowser() {
    if (!isInAppBrowser())
        return false;

    show(document.getElementById('app-shroud'));
    hide(document.getElementById('mainUI'));

    const isAndroid = /Android/i.test(navigator.userAgent);
    if (isAndroid) {
        const currentUrl = window.location.href.replace(/https?:\/\//, "");
        window.location.href = `intent://${currentUrl}#Intent;scheme=https;package=com.android.chrome;end`;
    }
    return true;
}

async function updateVersion() {
    const keys = await caches.keys();
    const version = keys.find(key => key.startsWith('epub-s2tw')).split('-').at(-1);
    if (version)
        document.getElementById('version').textContent = ` ${version}`;
}

async function init() {
    if (checkInAppBrowser())
        return;
    initOptions();
    await initServiceWorker();
    updateVersion();
    await initPythonWorker();
}

document.addEventListener('DOMContentLoaded', () => {
    init();
});

/* vim:et:set sw=4: */

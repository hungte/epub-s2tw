# epub-s2tw
Easy script to convert Simplified Chinese epubs to Taiwan Traditional Chinese

- 殘体 epub 看了很礙眼。
- 直書 epub 更是難以閱讀。
- iOS 上的 epub 簡轉繁幾乎都要付費。
- 試了很多 epub converter 都各有各的問題。
- 很多 epub 簡轉繁網站有檔案大小的限制或要廣告。
- Calibre 很好用，可是每次操作都要按半天 plugins 很累。

自己寫一個最快。

## Web & PWA version
- 網頁版： https://hungte.github.io/epub-s2tw/
- 同時支援 PWA (Progressive Web Application)

## Command line version

### Depenedncy

- Python 3.9+
- pip3 install opencc-python-reimplemented

### Usage

`./epub-s2tw.py [-h] [-o OUT] [-c CC_CONFIG] [--v2h] xxx.epub *.epub`

The usage is inspired by OpenCC. Use `-h` for more details.
The output will be using the converted file name (e.g., changing all Simplified
Chinese characters to Traditional Chinese if using s2t config), or `*.[config].epub`
if the input and output will be the same file.

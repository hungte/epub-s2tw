# epub-s2tw
Easy script to convert Simplified Chinese epubs to Taiwan Traditional Chinese

- 殘体 epub 看了很礙眼。
- Web based 有檔案大小的限制。
- 試了很多 epub converter 都各有各的問題。
- Calibre 很好用，可是每次操作都要按半天 plugins 很累。

自己寫一個最快。

## Depenedncy

- Python 3.9+
- pip3 install opencc-python-reimplemented

## Usage

`./epub-s2tw.py xxx.epub *.epub`

The output will be using the Traditional Chinese file name (if the input file
was using a Simplified Chinese file name), or overwrite the input file if it
doesn't have any Simplified Chinese characters.

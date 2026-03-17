import zipfile
import io
import os
import re
import tempfile
from opencc import OpenCC

# Imported variables: epub_v2h, epub_bytes

CSS_PATTERN = re.compile(r'[-a-z]*writing-mode:\s*vertical-rl\s*;')
OPF_PATTERN = re.compile(r'page-progression-direction\s*=\s*"rtl"')
CONVERT_EXTS = ('.html', '.xhtml', '.opf', '.ncx', '.txt', '.css')
V2H = epub_v2h
print('V2H: ', V2H);


def convert_css(s):
    if not V2H:
        return s
    return CSS_PATTERN.sub('', s)


def convert(s, name):
    if name.endswith('.css'):
        return convert_css(s)
    if V2H and name.endswith('.opf'):
        s = OPF_PATTERN.sub('', s)
    return cc.convert(s)


def process():
    cc = OpenCC('s2t')
    input_data = epub_bytes.to_py()
    output_buffer = io.BytesIO()

    with zipfile.ZipFile(io.BytesIO(input_data), 'r') as zin:
        with zipfile.ZipFile(output_buffer, 'w', zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                content = zin.read(item.filename)
                if item.filename.endswith(CONVERT_EXTS):
                    try:
                        text = content.decode('utf-8')
                        converted = convert(text, item.filename)
                        zout.writestr(item.filename, converted.encode('utf-8'))
                        continue
                    except:
                        pass
                zout.writestr(item.filename, content)

    return output_buffer.getvalue()

process()

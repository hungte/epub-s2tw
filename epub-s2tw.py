#!/usr/bin/env python3

# Convert CHS epub files to CHT (TW).
# Author: Hung-Te Lin <hungte@gmail.com>

import io
import re
import sys
import zipfile
from pathlib import Path
from opencc import OpenCC


CSS_EXT = '.css'
OPF_EXT = '.opf'
CSS_PATTERN = re.compile(r'[-a-z]*writing-mode:\s*vertical-rl\s*;')
OPF_PATTERN = re.compile(r'page-progression-direction\s*=\s*"rtl"')
CONVERT_EXTS = ('.html', '.xhtml', '.ncx', '.txt', OPF_EXT, CSS_EXT)

# Global (and imported) Configs
V2H = False
CC = OpenCC('s2t')
CC_EXT = 'tw'


def convert_css(s):
    if not V2H:
        return s
    return CSS_PATTERN.sub('', s)


def convert_content(cc, s, name):
    if name.endswith(CSS_EXT):
        return convert_css(s)
    if V2H and name.endswith(OPF_EXT):
        s = OPF_PATTERN.sub('', s)
    return cc.convert(s)


def convert_entry(cc, content, name):
    if not name.endswith(CONVERT_EXTS):
        return content
    try:
        text = content.decode('utf-8')
        converted = convert_content(cc, text, name)
        return converted.encode('utf-8')
    except:
        print(f'warning: conversion failed at {name}')
        pass
    return content


def convert_archive(cc, source, output):
    with zipfile.ZipFile(source, 'r') as zin:
        with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                content = zin.read(item.filename)
                zout.writestr(item.filename,
                    convert_entry(cc, content, item.filename))
    return output


def web_main():
    V2H = epub_v2h
    return convert_archive(
                CC, io.BytesIO(epub_bytes.to_py()),
                io.BytesIO()).getvalue()


def main(prog, argv):
    if len(argv) < 1:
        exit(f'Usage: {prog} epub-file(s)...')

    for p in argv:
        path = Path(p)
        cht_name = CC.convert(path.name)
        if path.name == cht_name:
            cht_name = f'{path.stem}.cht{path.suffix}'
        output = path.with_name(cht_name)
        print(f'Processing {path} -> {output}...')
        convert_archive(CC, path, output)


def Main():
    if sys.platform == 'emscripten':
        # Pyodide / web
        return web_main()
    elif __name__ == '__main__':
        # Command line
        return main(sys.argv[0], sys.argv[1:])


# Main() as the last return value for passing results to Pyodide.
Main()


# vim: et:sw=4

#!/usr/bin/env python3

# Convert CHS epub files to CHT (TW).
# Author: Hung-Te Lin <hungte@gmail.com>

import io
import re
import sys
import zipfile
from pathlib import Path
from types import SimpleNamespace
from opencc import OpenCC


CSS_EXT = '.css'
OPF_EXT = '.opf'
CSS_PATTERN = re.compile(r'[-a-z]*writing-mode:\s*vertical-rl\s*;')
OPF_PATTERN = re.compile(r'page-progression-direction\s*=\s*"rtl"')
CONVERT_EXTS = ('.html', '.xhtml', '.ncx', '.txt', OPF_EXT, CSS_EXT)

# Global (and imported) Configs
V2H = False
CC = OpenCC('s2t')
CC_EXT = '.cht'


def convert_content(cfg, s, name):
    if cfg.v2h:
        if name.endswith(CSS_EXT):
            print(f'Converted V2H - {CSS_EXT}')
            return CSS_PATTERN.sub('', s)
        if name.endswith(OPF_EXT):
            print(f'Converted V2H - {OPF_EXT}')
            s = OPF_PATTERN.sub('', s)
    return cfg.cc(s)


def convert_entry(cfg, content, name):
    if not name.endswith(CONVERT_EXTS):
        return content
    try:
        text = content.decode('utf-8')
        converted = convert_content(cfg, text, name)
        return converted.encode('utf-8')
    except:
        print(f'warning: conversion failed at {name}')
        pass
    return content


def convert_archive(cfg, source, output):
    with zipfile.ZipFile(source, 'r') as zin:
        with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                content = zin.read(item.filename)
                zout.writestr(item.filename,
                    convert_entry(cfg, content, item.filename))
    return output


def web_main():
    cfg = SimpleNamespace()
    cfg.cc = lambda x: x
    cfg.v2h = epub_v2h
    if epub_cc:
        cfg.cc = OpenCC(epub_cc).convert
    print(f'web_main started, V2H={cfg.v2h}, CC={epub_cc}')
    return convert_archive(
                cfg, io.BytesIO(epub_bytes.to_py()),
                io.BytesIO()).getvalue()


def main(prog, argv):
    if len(argv) < 1:
        exit(f'Usage: {prog} epub-file(s)...')
    cfg = SimpleNamespace()
    cfg.cc = CC.convert
    cfg.v2h = V2H

    for p in argv:
        path = Path(p)
        cc_name = cfg.cc(path.name)
        if path.name == cc_name:
            cc_name = f'{path.stem}{CC_EXT}{path.suffix}'
        output = path.with_name(cc_name)
        print(f'Processing {path} -> {output}...')
        convert_archive(cfg, path, output)


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

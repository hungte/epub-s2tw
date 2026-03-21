#!/usr/bin/env python3

# Convert CHS epub files to CHT (TW).
# Author: Hung-Te Lin <hungte@gmail.com>

import argparse
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


def convert_content(cfg, s, name):
    if cfg.v2h:
        if name.endswith(CSS_EXT):
            print(f'Converted V2H - {CSS_EXT}')
            return CSS_PATTERN.sub('', s)
        if name.endswith(OPF_EXT):
            print(f'Converted V2H - {OPF_EXT}')
            s = OPF_PATTERN.sub('', s)
    return cfg.convert(s)


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


def setup_cc_convert(cfg, cc):
    cfg.cc = cc
    cfg.convert = OpenCC(cc).convert if cc else lambda x: x


def config_to_name(cc):
    t = cc.split('2')[-1]
    name = 'cht'

    if t in ['twp', 'sp']:
        t = t[:-1]

    if len(t) > 1:
        # tw, hk, jp
        return t
    elif t in ['s', 't']:
        return f'ch{t}'

    # Default
    return 'cht'


def web_main():
    cfg = web_params
    setup_cc_convert(cfg, cfg.cc_config)
    print(f'web_main started, v2h={cfg.v2h}, cc_config={cfg.cc}')
    return convert_archive(
                cfg, io.BytesIO(cfg.contents.to_py()),
                io.BytesIO()).getvalue()


def main(prog, argv):
    parser = argparse.ArgumentParser(
        description="EPUB 簡繁轉換工具 (參考 OpenCC 語法)",
        formatter_class=argparse.RawTextHelpFormatter)
    parser.add_argument( 'inputs', metavar='INPUT', nargs='+',
        help='一個或多個輸入的 EPUB 檔案路徑')
    parser.add_argument( '-o', '--output', metavar='<output>',
        help='單一輸入且結尾為 .epub 時為輸出檔名，否則為輸出目錄', default='.')
    parser.add_argument( '-c', '--config', metavar='<cc>',
        help='轉換設定 (例如: s2t, t2twp)\n'
             's2t: 簡體 -> 繁體\n'
             's2twp: 簡體 -> 台灣正體 (含詞彙修正)', default='s2t')
    parser.add_argument( '-V', '--v2h', metavar='<v2h>',
        help='直書轉橫書\n', default=False)
    args = parser.parse_args()

    cfg = SimpleNamespace()
    cfg.v2h = args.v2h
    setup_cc_convert(cfg, args.config)
    out_dir = Path(args.output)
    out_path = ''

    if len(args.inputs) == 1 and args.output.endswith('.epub'):
        out_dir = ''
        out_path = args.output

    for p in args.inputs:
        path = Path(p)
        output = out_dir / Path(out_path or cfg.convert(path.name))
        if output.resolve() == path.resolve():
            output = output.with_name(f'{path.stem}.{config_to_name(cfg.cc)}{path.suffix}');
        print(f'Processing {path} -> {output}...')
        output.parent.mkdir(parents=True, exist_ok=True)
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

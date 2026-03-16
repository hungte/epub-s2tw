#!/usr/bin/env python3

# Convert CHS epub files to CHT (TW).
# Author: Hung-Te Lin <hungte@gmail.com>

import os
import re
import shutil
import sys
import tempfile
from pathlib import Path
from opencc import OpenCC


# Change this to different locales if you need.
CC = OpenCC('s2tw')

CSS_PATTERN = re.compile(r'[-a-z]*writing-mode:\s*vertical-rl\s*;');
OPF_PATTERN = re.compile(r'page-progression-direction\s*=\s*"rtl"');
V2H = False # vertical to horizontal


def convert_css(s):
    if not V2H:
        return s
    return CSS_PATTERN.sub('', s)


def convert(s, name):
    if name.suffix == '.css':
        return convert_css(s)
    if V2H and name.suffix == '.opf':
        s = OPF_PATTERN.sub('', s)
    return CC.convert(s)

def convert_file(path):
    # Enable this for extra debug messages
    # print(f' - {path}')
    with open(path) as f:
        src = f.read()
    with open(path, 'w') as f:
        f.write(convert(src, path))


def convert_files(folder, exts):
    for path in Path(folder).glob(r'**/*'):
        if not path.suffix in exts:
            continue
        convert_file(path)


def convert_epub(epub_path, temp):

    path = Path(epub_path)
    print(f'Unpacking {path}...')
    shutil.unpack_archive(path, temp, 'zip')

    print(f'Converting {path}...')
    convert_files(temp, ['.opf', '.ncx', '.xhtml', '.html', '.txt', '.css'])

    new_path = path.with_name(CC.convert(path.name))
    if (new_path == path):
        print(f'WARNING: replacing the original epub: {path} !!!')

    print(f'Repacking to {new_path}...')
    new_archive = Path(shutil.make_archive(new_path, 'zip', temp))
    new_archive.replace(new_path)


def main(prog, argv):
    if len(argv) < 1:
        exit(f'Usage: {prog} epub-file(s)...')

    for p in argv:
        with tempfile.TemporaryDirectory('epubconv_') as temp:
            convert_epub(p, temp)


if __name__ == '__main__':
    main(sys.argv[0], sys.argv[1:])

# vim: et:sw=4

#!/usr/bin/env python3
"""Genera árboles JSON para representar en React el marcado visible de las páginas antiguas.

Requiere Python 3 + beautifulsoup4 (solo para desarrollo; Cloudflare consume los JSON ya generados).
Las etiquetas <script> del body se omiten: LegacyRuntime carga los scripts en orden controlado.
"""
from __future__ import annotations
import hashlib, json, re
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString, Comment, Tag

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(__file__).resolve().parent / 'contenido' / 'arboles-react'
PAGES = ['index.html', 'chat.html', 'alias.html', 'ayuda.html', 'offline.html']
VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}

def body_of(file: Path) -> str:
    text = file.read_text(encoding='utf-8')
    match = re.search(r'<body[^>]*>([\s\S]*?)</body>', text, re.I)
    if not match:
        raise ValueError(f'{file.name}: no se encontró body')
    return match.group(1).replace('\r\n', '\n').strip()

def node_of(node):
    if isinstance(node, Comment):
        return None
    if isinstance(node, NavigableString):
        value = str(node)
        return {'type': 'text', 'value': value} if value else None
    if not isinstance(node, Tag):
        return None
    tag = node.name.lower()
    if tag == 'script':
        return None
    attrs = {}
    for key, value in node.attrs.items():
        key = key.lower()
        if isinstance(value, list):
            value = ' '.join(str(v) for v in value)
        elif value is None:
            value = True
        else:
            value = str(value)
        attrs[key] = value
    children = [] if tag in VOID else [x for c in node.children if (x := node_of(c)) is not None]
    return {'type': 'element', 'tag': tag, 'attrs': attrs, 'children': children}

OUT.mkdir(parents=True, exist_ok=True)
for page in PAGES:
    raw = body_of(ROOT / page)
    soup = BeautifulSoup(raw, 'html.parser')
    nodes = [x for c in soup.contents if (x := node_of(c)) is not None]
    payload = {
        'source': page,
        'sourceHash': hashlib.sha256(raw.encode('utf-8')).hexdigest(),
        'sourceCharacters': len(raw.encode('utf-16-le')) // 2,
        'nodes': nodes,
    }
    dest = OUT / (page.removesuffix('.html') + '.json')
    dest.write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    def walk(ns):
        for n in ns:
            if n['type'] == 'element':
                yield n
                yield from walk(n.get('children', []))
    elements = list(walk(nodes))
    ids = [n['attrs']['id'] for n in elements if 'id' in n['attrs']]
    if len(ids) != len(set(ids)):
        raise ValueError(f'{page}: IDs duplicados encontrados: {ids}')
    print(f'{page}: {len(elements)} elementos, {len(ids)} IDs, {len(raw):,} caracteres -> {dest.relative_to(ROOT)}')

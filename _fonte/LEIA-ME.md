# Fonte do site

- `index.tpl.html`: modelo do `index.html`. Edite aqui, não no `index.html`.
- `build.py`: gera o `index.html` (fotos com srcset, links do WhatsApp, ícones)
  e atualiza o `vercel.json`. Rodar da raiz do projeto: `python _fonte/build.py`
  (precisa de Python 3 com Pillow).
- `servidor_vercel.py`: servidor local que aplica os cabeçalhos do
  `vercel.json` e responde o `404.html`. Rodar: `python _fonte/servidor_vercel.py 8520 .`

`404.html` e `privacidade.html` são editados direto na raiz.
Esta pasta não é publicada (ver `.vercelignore`).

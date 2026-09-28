import re,os,glob,urllib.parse
from PIL import Image
# Gera o index.html a partir de _fonte/index.tpl.html e atualiza o
# vercel.json (hash do script inline na CSP). Rodar: python _fonte/build.py
FONTE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(os.path.dirname(FONTE), '').replace('\\', '/')
t=open(os.path.join(FONTE, 'index.tpl.html'),encoding='utf-8').read()
msg="Olá! Vim pelo site do Ateliê Aquarius e gostaria de um orçamento."
WA='https://wa.me/5567996776309?text='+urllib.parse.quote(msg,safe='!')
def widths(n):
    fs=glob.glob(ROOT+f'assets/img/{n}-*.jpg'); ws=sorted(int(re.search(r'-(\d+)\.jpg$',f).group(1)) for f in fs); return ws
def pic(arg):
    n,alt,sizes,mode=arg.split('|')
    ws=widths(n); W=ws[-1]; H=Image.open(ROOT+f'assets/img/{n}-{W}.jpg').size[1]
    ss=lambda ext:', '.join(f'assets/img/{n}-{w}.{ext} {w}w' for w in ws)
    attrs='fetchpriority="high" decoding="async"' if mode=='hero' else ('decoding="async"' if mode=='eager' else 'loading="lazy" decoding="async"')
    return (f'<picture><source type="image/avif" srcset="{ss("avif")}" sizes="{sizes}">'
            f'<source type="image/webp" srcset="{ss("webp")}" sizes="{sizes}">'
            f'<img src="assets/img/{n}-{W}.jpg" srcset="{ss("jpg")}" sizes="{sizes}" width="{W}" height="{H}" alt="{alt}" {attrs}></picture>')
def faq(arg):
    i,q,a=arg.split('|')
    return f'''<div class="faq__item">
            <h3><button class="faq__botao" type="button" id="faq-botao-{i}" aria-expanded="false" aria-controls="faq-painel-{i}">
              <span class="faq__num" aria-hidden="true">0{i}</span>
              <span class="faq__pergunta">{q}</span>
              <span class="faq__icone" aria-hidden="true"><svg class="icone"><use href="assets/icones.svg#mais"/></svg></span>
            </button></h3>
            <div class="faq__painel" id="faq-painel-{i}" role="region" aria-labelledby="faq-botao-{i}" hidden>
              <p class="faq__resposta">{a}</p>
            </div>
          </div>'''
t=t.replace('@@WA@@',WA.replace('&','&amp;'))
t=re.sub(r'@@ROLA (.+?)@@',lambda m:f'<span class="rola"><span>{m.group(1)}</span><span aria-hidden="true">{m.group(1)}</span></span>',t)
t=re.sub(r'@@ICO (\w+)@@',lambda m:f'<svg class="icone" aria-hidden="true" focusable="false"><use href="assets/icones.svg#{m.group(1)}"/></svg>',t)
t=re.sub(r'@@ICOF (\w+)@@',lambda m:f'<svg class="icone icone--cheio" aria-hidden="true" focusable="false"><use href="assets/icones.svg#{m.group(1)}"/></svg>',t)
t=re.sub(r'@@PIC (.+?)@@',lambda m:pic(m.group(1)),t)
t=re.sub(r'@@FAQ (.+?)@@',lambda m:faq(m.group(1)),t)
assert '@@' not in t
open(ROOT+'index.html','w',encoding='utf-8',newline='\n').write(t)
print(WA)

# ---------- vercel.json: cabeçalhos de segurança ----------
# o hash do script inline do <head> entra na CSP; recalculado a cada build
import hashlib, base64, json
inline = re.findall(r'<script>(.*?)</script>', t, re.S)
hashes = ["'sha256-" + base64.b64encode(hashlib.sha256(s.encode('utf-8')).digest()).decode() + "'" for s in inline]
csp = '; '.join([
    "default-src 'self'",
    "script-src 'self' " + ' '.join(hashes) + " https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "media-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
])
vercel = {
    "headers": [{
        "source": "/(.*)",
        "headers": [
            {"key": "Content-Security-Policy", "value": csp},
            {"key": "X-Content-Type-Options", "value": "nosniff"},
            {"key": "X-Frame-Options", "value": "DENY"},
            {"key": "Referrer-Policy", "value": "strict-origin-when-cross-origin"},
            {"key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=(), usb=()"},
        ],
    }]
}
open(ROOT + 'vercel.json', 'w', encoding='utf-8', newline='\n').write(json.dumps(vercel, ensure_ascii=False, indent=2) + '\n')

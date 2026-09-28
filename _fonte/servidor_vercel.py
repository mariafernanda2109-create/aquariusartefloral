# Simula a Vercel localmente: aplica os cabeçalhos do vercel.json e
# responde 404.html para caminhos inexistentes.
import http.server, json, os, sys
RAIZ = sys.argv[2] if len(sys.argv) > 2 else '.'
PORTA = int(sys.argv[1]) if len(sys.argv) > 1 else 8520
os.chdir(RAIZ)
CAB = [(h['key'], h['value']) for h in json.load(open('vercel.json', encoding='utf-8'))['headers'][0]['headers']]
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        for k, v in CAB:
            if k == 'Content-Security-Policy':
                v = v.replace('; upgrade-insecure-requests', '')  # servidor local é http
            self.send_header(k, v)
        super().end_headers()
    def send_error(self, code, message=None, explain=None):
        if code == 404 and os.path.exists('404.html'):
            corpo = open('404.html', 'rb').read()
            self.send_response(404)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(corpo)))
            self.end_headers()
            self.wfile.write(corpo)
            return
        super().send_error(code, message, explain)
http.server.ThreadingHTTPServer(('', PORTA), H).serve_forever()

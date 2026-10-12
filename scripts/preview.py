"""Local static-export preview with clean route rewrites, no deployment."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit, unquote
ROOT = Path(__file__).resolve().parents[1] / 'out'
class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def do_GET(self):
        path = unquote(urlsplit(self.path).path)
        candidate = (ROOT / path.lstrip('/')).resolve()
        if candidate.is_relative_to(ROOT.resolve()) and not candidate.exists() and candidate.with_suffix('.html').is_file():
            self.path = path + '.html'
        super().do_GET()
if __name__ == '__main__':
    print('EverRae preview http://localhost:4190', flush=True)
    ThreadingHTTPServer(('0.0.0.0', 4190), Handler).serve_forever()

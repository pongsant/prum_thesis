"""Local preview with byte-range support for seeking in WAV files."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import re

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(Path(__file__).parent / 'dist'), **kwargs)
    def send_head(self):
        path = Path(self.translate_path(self.path))
        byte_range = self.headers.get('Range')
        if byte_range and path.is_file():
            match = re.fullmatch(r'bytes=(\d*)-(\d*)', byte_range)
            if match:
                size = path.stat().st_size
                first, last = match.groups()
                start = int(first) if first else max(0, size-int(last or size))
                end = min(int(last) if last and first else size-1, size-1)
                if start > end or start >= size:
                    self.send_response(416); self.send_header('Content-Range', f'bytes */{size}'); self.end_headers(); return None
                self.send_response(206)
                self.send_header('Content-Type', self.guess_type(str(path)))
                self.send_header('Accept-Ranges', 'bytes')
                self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
                self.send_header('Content-Length', str(end-start+1)); self.end_headers()
                self.range_length = end-start+1
                file = path.open('rb'); file.seek(start); return file
        return super().send_head()
    def copyfile(self, source, output):
        remaining = getattr(self, 'range_length', None)
        if remaining is None:
            return super().copyfile(source, output)
        while remaining:
            chunk = source.read(min(65536, remaining))
            if not chunk: break
            output.write(chunk); remaining -= len(chunk)
        del self.range_length

if __name__ == '__main__':
    print('Cycle of Love: http://localhost:4173', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 4173), Handler).serve_forever()

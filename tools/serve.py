#!/usr/bin/env python3
"""Dev server for the kitchen sink that never lets the browser reuse stale JS/CSS (Cache-Control: no-store).
Usage: python3 tools/serve.py [port]   (default 8395, serves the repo root)"""
import http.server, functools, os, sys
class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate"); self.send_header("Pragma", "no-cache"); self.send_header("Expires", "0")
        super().end_headers()
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8395
http.server.ThreadingHTTPServer(("", port), functools.partial(NoCache, directory=root)).serve_forever()

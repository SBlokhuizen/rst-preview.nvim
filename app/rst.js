'use strict'
const { spawnSync } = require('child_process')
const logger = require('./lib/util/logger')('app/rst')

const PYTHON_SCRIPT = `
import sys
import json
from docutils.core import publish_parts
from docutils.writers.html4css1 import Writer, HTMLTranslator

data = json.loads(sys.stdin.read())
lines = data['lines']
source = '\\n'.join(lines)

class LineAwareTranslator(HTMLTranslator):
    def starttag(self, node, tagname, suffix='\\n', empty=False, **attributes):
        if hasattr(node, 'line') and node.line is not None:
            attributes['data-source-line'] = str(node.line - 1)
        return HTMLTranslator.starttag(self, node, tagname, suffix, empty, **attributes)

class LineAwareWriter(Writer):
    def __init__(self):
        Writer.__init__(self)
        self.translator_class = LineAwareTranslator

settings = {
    'halt_level': 5,
    'report_level': 5,
    'embed_stylesheet': False,
    'stylesheet_path': None,
    'stylesheet': None,
    'input_encoding': 'utf-8',
    'output_encoding': 'utf-8',
}

try:
    parts = publish_parts(source=source, writer=LineAwareWriter(), settings_overrides=settings)
    print(json.dumps({'html': parts['html_body'], 'title': '', 'error': None}))
except Exception as e:
    print(json.dumps({'html': '<pre class="rst-error">' + str(e) + '</pre>', 'title': '', 'error': str(e)}))
`

function rewriteImagePaths(html) {
  // Rewrite all img src attributes to go through /_local_image_/ route
  return html.replace(/(<img\s[^>]*src=")([^"]+)(")/gi, (match, pre, src, post) => {
    // Leave absolute URLs and data URIs alone
    if (/^(https?:\/\/|\/\/|data:)/.test(src)) return match
    // Already rewritten
    if (src.startsWith('/_local_image_/')) return match
    return pre + '/_local_image_/' + encodeURIComponent(src) + post
  })
}

function renderRST(lines) {
  try {
    const input = JSON.stringify({ lines })
    const result = spawnSync('python3', ['-c', PYTHON_SCRIPT], {
      input,
      encoding: 'utf-8',
      timeout: 10000
    })
    if (result.error) {
      logger.error('python3 spawn error:', result.error)
      return { html: `<pre class="rst-error">Error: ${result.error.message}</pre>`, title: '' }
    }
    if (result.status !== 0) {
      logger.error('python3 stderr:', result.stderr)
      return { html: `<pre class="rst-error">${result.stderr}</pre>`, title: '' }
    }
    const parsed = JSON.parse(result.stdout.trim())
    parsed.html = rewriteImagePaths(parsed.html)
    return parsed
  } catch (e) {
    logger.error('renderRST error:', e)
    return { html: `<pre class="rst-error">${e.message}</pre>`, title: '' }
  }
}

exports.renderRST = renderRST

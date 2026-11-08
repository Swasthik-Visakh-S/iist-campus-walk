"""Smoke-test the Pages project path and real WebGL rendering on the GitHub runner."""
import base64
import functools
import json
import shutil
import subprocess
import tempfile
import threading
import time
import urllib.error
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'browser-checks'


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def request(url, data=None):
    body = None if data is None else json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=90) as res:
            return json.load(res)['value']
    except urllib.error.HTTPError as exc:
        raise RuntimeError(exc.read().decode()) from exc


def check(session, site):
    def js(code):
        return request(session + '/execute/sync', {'script': code, 'args': []})

    def capture(name):
        for attempt in range(3):
            try:
                (OUT / (name + '.png')).write_bytes(base64.b64decode(request(session + '/screenshot')))
                return
            except RuntimeError as error:
                if attempt == 2 or 'Timed out receiving message from renderer' not in str(error):
                    raise

    request(session + '/url', {'url': site})
    deadline = time.monotonic() + 100
    while not js("return !document.querySelector('#loading') && document.querySelector('#destination')?.options.length > 30"):
        if time.monotonic() > deadline:
            raise AssertionError(js('return document.body.innerText'))
        time.sleep(.5)
    assert js("return !document.querySelector('#walk').disabled && !!document.querySelector('#world').getContext('webgl2')")
    js("const q=document.querySelector('#quality'); q.value='low'; q.dispatchEvent(new Event('change'));")
    capture('campus-overview')
    # Use a trusted user gesture to check real browser audio unlocking and decoding.
    button=request(session+'/element',{'using':'css selector','value':'#soundButton'})
    sound_id=next(iter(button.values()))
    for enabled in [False, True]:
        request(session+'/element/'+sound_id+'/click',{})
        assert js("return document.querySelector('#soundButton').getAttribute('aria-pressed')") == str(enabled).lower()
    assert js("return !!document.createElement('audio').canPlayType('audio/mpeg')")
    probe=request(session+'/execute/async',{'script':'''
        const done=arguments[arguments.length-1],audio=new Audio('./audio/plucky-comedy.mp3');
        audio.onloadedmetadata=()=>done(audio.duration);audio.onerror=()=>done(0);audio.load();
    ''','args':[]})
    assert 80 < probe < 83, 'Music must decode to the full uploaded song'

    js("document.querySelector('#start').click();document.querySelector('#boardButton').click()")
    assert js("return document.querySelector('#boardButton').getAttribute('aria-pressed') === 'true'")
    for place, file in [('OAT hostel steps','oat-hostel-steps'),('Rohini','rohini-road'),
                        ('Football turf entrance','turf-entrance'),('Interdisciplinary Block','d1-entrance'),
                        ('Avionics Block','d3-entrance'),('Cafeteria','cafeteria-frontage'),('Front gate','front-checkpoint')]:
        js("""const menu=document.querySelector('#destination');
            menu.value=[...menu.options].find(o=>o.textContent===%s).value;
            menu.dispatchEvent(new Event('change'));""" % json.dumps(place))
        time.sleep(.8)
        capture(file)
    request(session + '/window/rect', {'width': 430, 'height': 850})
    assert js("return getComputedStyle(document.querySelector('#touch')).display!=='none'")
    capture('phone-controls')
    js("document.querySelector('#idButton').click()")
    assert js("return document.querySelector('#gateStatus').textContent.includes('ID accepted')")
    assert js("return !document.querySelector('#world').getContext('webgl2').isContextLost()")
    print('Rendered the campus, visited the hostel and checkpoint, and exercised small-screen controls.')


def main():
    OUT.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as directory:
        Path(directory, 'iist-campus-walk').symlink_to(ROOT, target_is_directory=True)
        http = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=directory))
        threading.Thread(target=http.serve_forever, daemon=True).start()
        with subprocess.Popen([shutil.which('chromedriver') or 'chromedriver', '--port=9515'], stdout=subprocess.DEVNULL) as driver:
            base = 'http://127.0.0.1:9515'
            try:
                for attempt in range(60):
                    try:
                        request(base+'/status')
                        break
                    except urllib.error.URLError:
                        time.sleep(.25)
                options = {'args':['--headless=new','--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader','--window-size=1200,800']}
                session = request(base+'/session', {'capabilities':{'alwaysMatch':{'browserName':'chrome','goog:chromeOptions':options}}})
                check(base+'/session/'+session['sessionId'], 'http://127.0.0.1:'+str(http.server_port)+'/iist-campus-walk/')
            finally:
                driver.terminate()
                http.shutdown()


if __name__ == '__main__':
    main()

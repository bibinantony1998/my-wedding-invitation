import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request(
    'https://api.github.com/search/code?q=filename:page-turn+extension:mp3',
    headers={'User-Agent': 'Mozilla/5.0'}
)
try:
    with urllib.request.urlopen(req, context=ctx) as response:
        data = json.loads(response.read().decode())
        if 'items' in data and len(data['items']) > 0:
            for item in data['items']:
                url = item['html_url'].replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/')
                print("Downloading:", url)
                urllib.request.urlretrieve(url, 'assets/page-flip.mp3')
                break
except Exception as e:
    print(e)

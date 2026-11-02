"""Refresh the site's episode snapshot at build time, never in visitors' browsers."""
import json
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

def refresh():
    request = urllib.request.Request('https://anchor.fm/s/1089682c4/podcast/rss', headers={'User-Agent': 'FromPaychecksToPurpose-site-build/1.0'})
    with urllib.request.urlopen(request, timeout=15) as response:
        root = ET.fromstring(response.read())
    episodes = []
    for item in root.findall('./channel/item')[:6]:
        enclosure = item.find('enclosure')
        episodes.append({'title': item.findtext('title'), 'url': item.findtext('link'), 'date': item.findtext('pubDate'), 'audio': enclosure.get('url') if enclosure is not None else None})
    if not episodes or any(not item['title'] or not item['url'] for item in episodes):
        raise ValueError('Feed did not contain usable episodes')
    Path('episodes.json').write_text(json.dumps({'updated': datetime.now(timezone.utc).date().isoformat(), 'episodes': episodes}, indent=2) + '\n')

if __name__ == '__main__':
    try:
        refresh()
        print('Episode snapshot refreshed.')
    except Exception as error:
        print('Episode refresh unavailable; keeping existing snapshot:', error)
        if not Path('episodes.json').exists():
            raise

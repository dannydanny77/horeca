import urllib.request
import json
import time
import re

addresses = {
    1: 'Amstelstraat 41, Amsterdam',
    2: 'Haarlemmerdijk 8, Amsterdam',
    3: 'Ceintuurbaan 210, Amsterdam',
    4: 'Eerste van der Helststraat 35, Amsterdam',
    5: 'Parnassusweg 775, Amsterdam',
    6: 'Amstelveenseweg 53, Amsterdam',
    7: 'Amstel 1, Amsterdam',
    8: 'Keizer Karelweg 337, Amstelveen',
    9: 'Buitenveldertselaan 30, Amsterdam',
    10: 'Amstelstraat 26, Amsterdam',
    11: 'Amstelveenseweg 71, Amsterdam',
    13: 'Linnaeusstraat 18, Amsterdam'
}

coords = {}
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}

for loc_id, addr in addresses.items():
    url = 'https://nominatim.openstreetmap.org/search?q=' + urllib.parse.quote(addr) + '&format=json&limit=1'
    req = urllib.request.Request(url, headers=headers)
    try:
        response = urllib.request.urlopen(req).read()
        data = json.loads(response)
        if data:
            coords[loc_id] = {'lat': float(data[0]['lat']), 'lng': float(data[0]['lon'])}
            print(f"ID {loc_id}: {addr} -> {data[0]['lat']}, {data[0]['lon']}")
        else:
            print(f"ID {loc_id}: {addr} -> NOT FOUND")
    except Exception as e:
        print(f"ID {loc_id}: ERROR {e}")
    time.sleep(1.5)

with open('C:/Projects/Playground/horeca/data.js', 'r', encoding='utf-8') as f:
    content = f.read()

json_str = re.search(r'const locations = (\[.*\]);', content, re.DOTALL).group(1)
locations = json.loads(json_str)

for loc in locations:
    if loc['id'] in coords:
        loc['lat'] = coords[loc['id']]['lat']
        loc['lng'] = coords[loc['id']]['lng']

with open('C:/Projects/Playground/horeca/data.js', 'w', encoding='utf-8') as f:
    f.write('const locations = ')
    f.write(json.dumps(locations, indent=4))
    f.write(';\n')

print("All Done!")

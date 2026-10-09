"""Extract paired source values; usage: python3 scripts/extract-guardrail-history.py SOURCE.xlsx."""
import sys,zipfile,xml.etree.ElementTree as E,hashlib,json
from pathlib import Path
source=Path(sys.argv[1]);z=zipfile.ZipFile(source);ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
root=E.fromstring(z.read('xl/worksheets/sheet2.xml'));records=[]
for row in root.findall('.//m:row',ns):
 cells={''.join(filter(str.isalpha,c.attrib['r'])):c.find('m:v',ns).text for c in row.findall('m:c',ns) if c.find('m:v',ns) is not None and c.attrib.get('t')!='s'}
 try:y=int(cells.get('A','0'))
 except ValueError:continue
 if 1928<=y<=2025:records.append([y,float(cells['B']),float(cells['U'])])
assert [r[0] for r in records]==list(range(1928,2026))
assert all(-1<r[1]<2 and -1<r[2]<1 for r in records)
metadata={'source':'https://pages.stern.nyu.edu/~adamodar/pc/datasets/histretSP.xlsx','author':'Aswath Damodaran, NYU Stern','retrieved':'2026-10-08','sheet':'Returns by year','columns':'A (year), B (S&P 500 incl. dividends), U (CPI-U inflation)','period':'1928–2025','sha256':hashlib.sha256(source.read_bytes()).hexdigest()}
Path('guardrail-history.js').write_text('// Source facts only; percentage values are decimal rates. Reproduce with scripts/extract-guardrail-history.py.\nexport const historySource = '+json.dumps(metadata)+';\nexport const historicalYears = '+json.dumps(records)+';\n')
print(len(records),'paired years; first/last:',records[0],records[-1])

"""Publish the verified Java resource JAR alongside the website."""
from pathlib import Path
from zipfile import ZipFile
import shutil
import subprocess
root=Path(__file__).resolve().parents[1]
import re
# The file name follows the POM, so a version bump cannot ship a stale JAR under the old name.
version=re.search(r'<artifactId>colibri-templates</artifactId><version>([^<]+)</version>',(root/'java/colibri-templates/pom.xml').read_text()).group(1)
jar=root/f'java/colibri-templates/target/colibri-templates-{version}.jar'
def current():
    if not jar.exists(): return False
    try:
        with ZipFile(jar) as z:
            for folder, glob in [('thymeleaf','*.html'),('freemarker','*.ftl')]:
                files=list((root/folder).glob(glob))
                names=[n for n in z.namelist() if n.startswith(f'templates/colibri/{folder}/') and not n.endswith('/')]
                if len(names)!=len(files): return False
                for p in files:
                    if z.read(f'templates/colibri/{folder}/{p.name}') != p.read_bytes(): return False
        return True
    except (KeyError, OSError): return False
if not current():
    subprocess.run(['mvn','-q','-f',str(root/'java/colibri-templates/pom.xml'),'verify'],cwd=root,check=True)
if not current(): raise SystemExit('Java JAR does not match the source templates')
dest=root/'site/dist/downloads';dest.mkdir(parents=True,exist_ok=True)
shutil.copy2(jar,dest/jar.name)
print('Included verified Java template download')

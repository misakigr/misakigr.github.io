import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent


def read_text(path):
    return path.read_text(encoding="utf-8")


def write_text(path, content):
    path.write_text(content, encoding="utf-8", newline="\n")


def replace_once(content, pattern, replacement, filename):
    updated, count = re.subn(pattern, replacement, content, count=1)
    if count != 1:
        raise RuntimeError(f"Expected one match in {filename}: {pattern}")
    return updated


def set_version(version):
    app_js = ROOT / "app.js"
    service_worker = ROOT / "service-worker.js"
    index_html = ROOT / "index.html"
    version_json = ROOT / "version.json"

    app_content = read_text(app_js)
    app_content = replace_once(
        app_content,
        r'const APP_VERSION = "[^"]+";',
        f'const APP_VERSION = "{version}";',
        app_js.name,
    )
    write_text(app_js, app_content)

    sw_content = read_text(service_worker)
    sw_content = replace_once(
        sw_content,
        r'const APP_VERSION = "[^"]+";',
        f'const APP_VERSION = "{version}";',
        service_worker.name,
    )
    sw_content = replace_once(
        sw_content,
        r'"\./app\.js\?v=[^"]+"',
        f'"./app.js?v={version}"',
        service_worker.name,
    )
    sw_content = replace_once(
        sw_content,
        r'"\./styles\.css\?v=[^"]+"',
        f'"./styles.css?v={version}"',
        service_worker.name,
    )
    write_text(service_worker, sw_content)

    index_content = read_text(index_html)
    index_content = replace_once(
        index_content,
        r'\.\/styles\.css\?v=[^"\']+',
        f'./styles.css?v={version}',
        index_html.name,
    )
    index_content = replace_once(
        index_content,
        r'\.\/app\.js\?v=[^"\']+',
        f'./app.js?v={version}',
        index_html.name,
    )
    write_text(index_html, index_content)

    version_json.write_text(
        json.dumps({"version": version}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def main():
    version = sys.argv[1].strip() if len(sys.argv) > 1 else input("Version: ").strip()
    if not version:
        raise SystemExit("Version is required")
    if not re.fullmatch(r"[0-9A-Za-z._-]+", version):
        raise SystemExit("Use only letters, numbers, dots, underscores, or hyphens")

    set_version(version)
    print(f"Updated app version to {version}")


if __name__ == "__main__":
    main()

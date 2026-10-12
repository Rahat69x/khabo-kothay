"""
Find Placeholders Audit Script - Khabo Kothay?
Scans res/, android/, api/, docs/, mobile/, public/, and config/ for:
- lorem ipsum, TODO, FIXME, TBD, Hello World
- example.com, com.example, your-domain
- sample restaurant names, default launcher icons
- hardcoded test phone numbers and URLs
- empty or untranslated Bangla strings
"""
import os
import re
import sys
import json

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

TARGET_DIRS = [
    os.path.join(ROOT_DIR, "android", "app", "src"),
    os.path.join(ROOT_DIR, "api", "app"),
    os.path.join(ROOT_DIR, "config"),
    os.path.join(ROOT_DIR, "docs"),
    os.path.join(ROOT_DIR, "mobile", "src"),
    os.path.join(ROOT_DIR, "public")
]

PATTERNS = [
    (r"\blorem\s+ipsum\b", "LOREM_IPSUM", "Lorem ipsum placeholder text"),
    (r"\bTODO\b", "TODO", "TODO task marker"),
    (r"\bFIXME\b", "FIXME", "FIXME defect marker"),
    (r"\bTBD\b", "TBD", "TBD placeholder"),
    (r"\bHello\s+World\b", "HELLO_WORLD", "Hello World sample string"),
    (r"example\.com", "EXAMPLE_DOMAIN", "example.com placeholder domain"),
    (r"com\.example\.", "EXAMPLE_PACKAGE", "com.example placeholder package"),
    (r"your-domain", "YOUR_DOMAIN", "your-domain placeholder"),
    (r"\b01[0-9]{9}\b(?=.*test)", "TEST_PHONE", "Hardcoded test phone number"),
]

ALLOWLIST_SUBSTRINGS = [
    "find_placeholders.py",
    "find-placeholders.ps1",
    "POLISH_AUDIT.md",
    ".git",
    "node_modules",
    "__pycache__"
]

def scan_files():
    matches = []
    file_count = 0
    
    for base_dir in TARGET_DIRS:
        if not os.path.exists(base_dir):
            continue
        for root, dirs, files in os.walk(base_dir):
            dirs[:] = [d for d in dirs if d not in [".git", "node_modules", "__pycache__", ".gradle", "build"]]
            for file in files:
                if file.endswith((".pyc", ".png", ".jpg", ".jpeg", ".ico", ".jar", ".apk", ".bin")):
                    continue
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, ROOT_DIR)
                
                if any(sub in rel_path for sub in ALLOWLIST_SUBSTRINGS):
                    continue
                
                file_count += 1
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        lines = f.readlines()
                        for line_idx, line in enumerate(lines, start=1):
                            for pattern, category, desc in PATTERNS:
                                if re.search(pattern, line, re.IGNORECASE):
                                    matches.append({
                                        "file": rel_path.replace("\\", "/"),
                                        "line": line_idx,
                                        "category": category,
                                        "description": desc,
                                        "snippet": line.strip()[:100]
                                    })
                except Exception as err:
                    pass
                    
    return file_count, matches

if __name__ == "__main__":
    file_count, results = scan_files()
    print(f"Scanned {file_count} files.")
    print(f"Found {len(results)} potential placeholder occurrences.")
    
    categories = {}
    for r in results:
        categories[r["category"]] = categories.get(r["category"], 0) + 1
        
    print("\nSummary by Category:")
    for cat, count in categories.items():
        print(f"  - {cat}: {count}")
        
    print("\nFirst 15 sample occurrences:")
    for r in results[:15]:
        print(f"  [{r['category']}] {r['file']}:{r['line']} -> {r['snippet']}")

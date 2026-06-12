import os
import json
import urllib.parse

next_dir = "/Users/devkumarraikwar/git wrap/gitgravity/.next"
found = False

for root, dirs, files in os.walk(next_dir):
    for file in files:
        if file.endswith(".map"):
            map_path = os.path.join(root, file)
            try:
                with open(map_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    sources = data.get("sources", [])
                    sources_content = data.get("sourcesContent", [])
                    
                    for src, content in zip(sources, sources_content):
                        if "CommitGravityAnalytics.tsx" in src:
                            print(f"Found in map: {map_path}")
                            print(f"Source path in map: {src}")
                            print(f"Content length: {len(content)}")
                            out_path = "/Users/devkumarraikwar/git wrap/gitgravity/src/components/GitGravity/CommitGravityAnalytics.tsx"
                            os.makedirs(os.path.dirname(out_path), exist_ok=True)
                            with open(out_path, "w", encoding="utf-8") as out:
                                out.write(content)
                            print("Wrote file successfully!")
                            found = True
            except Exception as e:
                pass

if not found:
    print("Could not find CommitGravityAnalytics.tsx in sourcemaps.")

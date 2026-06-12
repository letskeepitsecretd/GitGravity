import json

log_path = "/Users/devkumarraikwar/.gemini/antigravity/brain/5b3dedcf-ee9d-4373-b0e9-5c6d7e8214fd/.system_generated/logs/transcript.jsonl"
target_file = "/Users/devkumarraikwar/git wrap/gitgravity/src/components/GitGravity/CommitGravityAnalytics.tsx"

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            tool_calls = data.get("tool_calls", [])
            for tc in tool_calls:
                name = tc.get("name")
                args = tc.get("args", {})
                if isinstance(args, str):
                    try:
                        args = json.loads(args)
                    except:
                        pass
                target = args.get("TargetFile", "")
                if target_file in target or target in target_file:
                    content = args.get("CodeContent")
                    if content:
                        print("FOUND SCRIPT:")
                        print(content)
                        # write it
                        os.makedirs(os.path.dirname(target_file), exist_ok=True)
                        with open(target_file, "w", encoding="utf-8") as out:
                            out.write(content)
                        print("Restored successfully!")
        except Exception as e:
            pass
import os

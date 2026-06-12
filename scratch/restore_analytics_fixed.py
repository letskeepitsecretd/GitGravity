import json
import os

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
                        print("FOUND SCRIPT at step:", data.get("step_index"))
                        # Write the file (we want the last step's code, so we overwrite as we go, or write all)
                        os.makedirs(os.path.dirname(target_file), exist_ok=True)
                        with open(target_file, "w", encoding="utf-8") as out:
                            out.write(content)
                        print("Wrote to file successfully!")
        except Exception as e:
            print("Error parsing line:", e)

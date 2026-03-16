import os
import re

files_to_process = [
    "LandingPage/Index.html",
    "LogInPage/LogInPage.html",
    "RegisterPage/RegisterPage.html",
    "NewPasswordPage/NewPasswordPage.html",
    "ResetPasswordPage/ResetPasswordPage.html",
]

def scale_match(match):
    prefix = match.group(1)
    val_str = match.group(2)
    suffix = match.group(3)
    val = float(val_str)
    new_val = val * 0.8
    if new_val.is_integer():
        return f"{prefix}-[{int(new_val)}{suffix}]"
    else:
        return f"{prefix}-[{round(new_val, 1)}{suffix}]"

def process_file(filepath):
    if not os.path.exists(filepath):
        print(f"Skipping {filepath}, not found")
        return
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    class_replacements = {
        r'\bh-20\b': 'h-16',
        r'\bh-14\b': 'h-11',
        r'\bh-12\b': 'h-10',
        r'\bh-10\b': 'h-8',
        r'\bw-6\b': 'w-5',
        r'\bh-6\b': 'h-5',
        r'\bw-5\b': 'w-4',
        r'\bh-5\b': 'h-4',
        r'\bw-4\b': 'w-3',
        r'\bh-4\b': 'h-3',
        r'\bw-3\b': 'w-2.5',
        r'\bh-3\b': 'h-2.5',
        r'\bpx-12\b': 'px-10',
        r'\bpx-11\b': 'px-9',
        r'\bpx-8\b': 'px-6',
        r'\bpx-6\b': 'px-5',
        r'\bpx-4\b': 'px-3',
        r'\bpy-16\b': 'py-12',
        r'\bpy-12\b': 'py-10',
        r'\bpy-10\b': 'py-8',
        r'\bpy-8\b': 'py-6',
        r'\bpy-4\b': 'py-3',
        r'\bpy-3\.5\b': 'py-3',
        r'\bpy-3\b': 'py-2.5',
        r'\bpt-16\b': 'pt-12',
        r'\bpb-12\b': 'pb-10',
        r'\bpt-8\b': 'pt-6',
        r'\bpb-10\b': 'pb-8',
        r'\bp-8\b': 'p-6',
        r'\bmb-6\b': 'mb-5',
        r'\bmt-8\b': 'mt-6',
        r'\bmt-6\b': 'mt-5',
        r'\bmt-3\b': 'mt-2',
        r'\bmt-2\b': 'mt-1.5',
        r'\bgap-12\b': 'gap-10',
        r'\bgap-8\b': 'gap-6',
        r'\bgap-6\b': 'gap-5',
        r'\bgap-5\b': 'gap-4',
        r'\bgap-4\b': 'gap-3',
        r'\bgap-3\b': 'gap-2.5',
        r'\bgap-1\.5\b': 'gap-1',
        r'\btext-2xl\b': 'text-xl',
        r'\btext-lg\b': 'text-base',
        r'\btext-sm\b': 'text-xs',
        r'calc\(100vh-80px\)': 'calc(100vh-64px)'
    }

    for pattern, repl in class_replacements.items():
        content = re.sub(pattern, repl, content)

    arbitrary_px_pattern = r'\b(text|max-w|min-w|w|h|rounded)-\[([0-9\.]+)(px)\]'
    content = re.sub(arbitrary_px_pattern, scale_match, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Processed {filepath}")

for f in files_to_process:
    process_file(f)

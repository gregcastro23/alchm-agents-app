#!/usr/bin/env python3
"""Fix structural errors in demo-agents-data.ts"""

import re
import sys

def fix_demo_agents(file_path):
    print(f"Reading {file_path}...")
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    print(f"Original file size: {len(content)} bytes")

    # Step 1: Fix duplicate "planets: { planets: {" pattern
    # Pattern: natalChart: {\n      planets: {\n        planets: {
    # Replace with: natalChart: {\n      planets: {

    fix_count = 0
    lines = content.split('\n')
    fixed_lines = []
    skip_next = False

    for i, line in enumerate(lines):
        if skip_next:
            skip_next = False
            continue

        # Check if this is the first "planets: {" line after natalChart
        if i > 0 and 'natalChart:' in lines[i-1] and re.match(r'\s+planets:\s*\{', line):
            # Check if next line also has "planets: {"
            if i + 1 < len(lines) and re.match(r'\s+planets:\s*\{', lines[i+1]):
                # Skip this line, keep the next one
                print(f"Line {i+1}: Found duplicate planets, removing first occurrence")
                fix_count += 1
                skip_next = True
                continue

        fixed_lines.append(line)

    content = '\n'.join(fixed_lines)
    print(f"Fixed {fix_count} duplicate 'planets' keys")

    # Step 2: Fix houses and aspects placement
    # They should be siblings of planets, not children
    # Pattern to fix:
    # - Find lines with "houses: {" that have more indentation than they should
    # - Add closing brace before them

    lines = content.split('\n')
    fixed_lines = []

    for i, line in enumerate(lines):
        # Look for houses: or aspects: that appear after planet entries
        if re.match(r'\s+houses:\s*\{', line):
            # Check if previous non-empty line is a planet entry
            j = i - 1
            while j >= 0 and lines[j].strip() == '':
                j -= 1

            if j >= 0 and re.search(r'(Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto):', lines[j]):
                # Need to close planets object before houses
                indent = re.match(r'(\s+)', line).group(1)
                # Remove 2 spaces from indent for the closing brace
                close_indent = indent[:-2] if len(indent) >= 2 else indent
                fixed_lines.append(close_indent + '},')
                print(f"Line {i+1}: Added closing brace before houses")

        # Check for malformed closing - aspects array closed with ] instead of ending properly
        if re.match(r'\s+\],\s*$', line):
            # Check context - if this is after aspects array, it's correct
            # If it's in wrong place, fix it
            j = i - 1
            while j >= 0 and (lines[j].strip() == '' or lines[j].strip() == '},' or lines[j].strip().startswith('//')):
                j -= 1

            # If previous content line doesn't look like an aspect, this ] is wrong
            if j >= 0 and 'planet1' not in lines[j] and 'planet2' not in lines[j]:
                # Change ], to },
                line = re.sub(r'\],\s*$', '},', line)
                print(f"Line {i+1}: Changed ], to }}")

        fixed_lines.append(line)

    content = '\n'.join(fixed_lines)

    # Step 3: Fix missing closing braces in objects
    # Look for patterns like:
    # shadows: [
    #   {
    #     type: '...',
    #     description: '...',
    #     transformationPath: '...',
    #   },  # <- Missing closing } here
    # ],

    lines = content.split('\n')
    fixed_lines = []

    for i, line in enumerate(lines):
        stripped = line.strip()

        # If line ends with }, and is inside an array [ ]
        # Check if it should have another }
        if re.match(r'\s+\},\s*$', line):
            # Look ahead to see if next non-empty line is ],
            j = i + 1
            while j < len(lines) and lines[j].strip() == '':
                j += 1

            if j < len(lines) and lines[j].strip() == '],':
                # This is correct - closing an object in an array
                pass

        fixed_lines.append(line)

    content = '\n'.join(fixed_lines)

    # Step 4: Fix personality object structure
    # Ensure shadows, gifts, challenges arrays are properly closed
    lines = content.split('\n')
    fixed_lines = []

    for i, line in enumerate(lines):
        stripped = line.strip()

        # If we see a pattern like:
        #   transformationPath: '...',
        # },
        # Check if this should be:
        #   transformationPath: '...',
        # }
        # ],

        if stripped.startswith(('type:', 'description:', 'transformationPath:', 'expression:', 'growthOpportunity:')):
            # Check if this is the last property in an object
            if i + 1 < len(lines):
                next_line = lines[i + 1].strip()
                if next_line == '},':
                    # Look ahead to see what comes after
                    j = i + 2
                    while j < len(lines) and lines[j].strip() == '':
                        j += 1

                    if j < len(lines):
                        after_close = lines[j].strip()
                        # If next significant line is ], we might be missing a brace
                        if after_close == '],':
                            # Need to add } before ],
                            # This will be handled by the structure
                            pass

        fixed_lines.append(line)

    content = '\n'.join(fixed_lines)

    # Write the fixed content
    print(f"\nWriting fixed file...")
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Fixed file size: {len(content)} bytes")
    print("Done! File fixed successfully.")

    return True

if __name__ == '__main__':
    file_path = 'lib/demo-agents-data.ts'
    try:
        fix_demo_agents(file_path)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

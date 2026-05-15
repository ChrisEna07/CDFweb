import sys

path = r'e:\aplicativos ChrizDev\CDF web\cdf-web\src\app\(dashboard)\page.js'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the last line that is part of the valid component before the mess
# The last valid line seems to be line 1639: )} (which is the end of the modalConfig block)
# But wait, looking at my last view_file:
# 1639:       )}
# This is correct. Everything after 1639 is debris.

new_lines = lines[:1639]
new_lines.append('    </div>\n')
new_lines.append('  )\n')
new_lines.append('}\n')

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

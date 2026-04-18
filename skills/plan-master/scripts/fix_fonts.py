#!/usr/bin/env python3
"""
字体 CDN 替换工具
将 Google Fonts CDN 替换为国内加速的 loli.net 镜像

使用方法:
    python fix_fonts.py input.html output.html
"""

import sys
import re


def fix_fonts(html: str) -> tuple[str, int]:
    """
    替换 Google Fonts CDN 为国内镜像
    
    Args:
        html: 原始 HTML 内容
        
    Returns:
        (替换后的 HTML, 替换次数)
    """
    # 统计替换次数
    count = html.count('fonts.googleapis.com')
    
    # 替换 Google Fonts CDN
    fixed_html = html.replace('fonts.googleapis.com', 'fonts.loli.net')
    
    return fixed_html, count


def main():
    if len(sys.argv) < 3:
        print("使用方法: python fix_fonts.py input.html output.html")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    with open(input_file, 'r', encoding='utf-8') as f:
        html = f.read()
    
    fixed_html, count = fix_fonts(html)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(fixed_html)
    
    if count > 0:
        print(f"✅ 已替换 {count} 处 Google Fonts CDN 为国内镜像")
    else:
        print("✅ 没有发现需要替换的 Google Fonts CDN")


if __name__ == '__main__':
    main()

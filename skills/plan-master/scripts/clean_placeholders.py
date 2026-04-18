#!/usr/bin/env python3
"""
清理 HTML 中未替换的图片占位符
删除所有 src 包含 __PLACEHOLDER__ 的 img 标签，并优化布局

使用方法:
    python clean_placeholders.py input.html output.html
"""

import sys
from bs4 import BeautifulSoup


def clean_placeholders(html: str) -> tuple[str, int]:
    """
    清理 HTML 中未替换的占位符图片
    
    Args:
        html: 原始 HTML 内容
        
    Returns:
        (清理后的 HTML, 删除的占位符数量)
    """
    soup = BeautifulSoup(html, 'html.parser')
    
    # 查找所有占位符图片
    placeholder_imgs = []
    for img in soup.find_all('img'):
        src = img.get('src', '')
        if src and '__PLACEHOLDER__' in src:
            placeholder_imgs.append(img)
    
    removed_count = len(placeholder_imgs)
    
    # 删除占位符图片
    for img in placeholder_imgs:
        # 获取父元素
        parent = img.parent
        
        # 删除图片
        img.decompose()
        
        # 如果父元素变空了，也可以考虑删除
        # 但这里保守处理，只删除图片本身
    
    return str(soup), removed_count


def main():
    if len(sys.argv) < 3:
        print("使用方法: python clean_placeholders.py input.html output.html")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    with open(input_file, 'r', encoding='utf-8') as f:
        html = f.read()
    
    cleaned_html, removed_count = clean_placeholders(html)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(cleaned_html)
    
    if removed_count > 0:
        print(f"✅ 已删除 {removed_count} 个未替换的占位符图片")
    else:
        print("✅ 没有发现未替换的占位符图片")


if __name__ == '__main__':
    main()

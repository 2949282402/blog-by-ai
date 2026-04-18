#!/usr/bin/env python3
"""
清理临时文件工具
只删除在当前 HTML 生成流程中创建的临时文件（通过显式传入文件列表）

使用方法:
    python cleanup.py <文件1> <文件2> ... [--keep <保留的文件>]
    
示例:
    # 删除指定的临时文件
    python cleanup.py step1.html step2.html --keep final.html
    
    # 删除多个临时文件
    python cleanup.py temp1.html temp2.html temp3.html
"""

import sys
import os
import argparse


def cleanup_files(files: list[str], keep_files: list[str] = None) -> tuple[list[str], int]:
    """
    删除指定的临时文件
    
    Args:
        files: 要删除的文件路径列表
        keep_files: 要保留的文件名列表
        
    Returns:
        (删除的文件列表, 删除的文件数量)
    """
    if keep_files is None:
        keep_files = []
    
    deleted_files = []
    
    for filepath in files:
        # 转换为绝对路径
        filepath = os.path.abspath(filepath)
        filename = os.path.basename(filepath)
        
        # 检查文件是否存在
        if not os.path.exists(filepath):
            print(f"⚠️  文件不存在，跳过: {filepath}")
            continue
        
        # 检查是否在保留列表中
        if filename in keep_files:
            print(f"📌 保留文件: {filename}")
            continue
        
        # 检查是否是最终文件
        if 'final' in filename.lower():
            print(f"📌 保留最终文件: {filename}")
            continue
        
        try:
            os.remove(filepath)
            deleted_files.append(filepath)
        except OSError as e:
            print(f"⚠️  无法删除 {filepath}: {e}")
    
    return deleted_files, len(deleted_files)


def main():
    parser = argparse.ArgumentParser(
        description='清理 HTML 生成过程中创建的临时文件（只删除显式指定的文件）',
        epilog='示例: python cleanup.py step1.html step2.html --keep final.html'
    )
    parser.add_argument('files', nargs='*', help='要删除的临时文件路径列表')
    parser.add_argument('--keep', '-k', nargs='*', default=[], help='要保留的文件名')
    parser.add_argument('--dry-run', '-n', action='store_true', help='仅显示将要删除的文件，不实际删除')
    
    args = parser.parse_args()
    
    if not args.files:
        print("❌ 请指定要删除的临时文件")
        print("用法: python cleanup.py <文件1> <文件2> ... [--keep <保留的文件>]")
        print("示例: python cleanup.py step1.html step2.html --keep final.html")
        sys.exit(1)
    
    files = args.files
    keep_files = args.keep
    
    if args.dry_run:
        print(f"📋 保留文件: {keep_files if keep_files else '无'}")
        print("\n将要删除的文件:")
        
        count = 0
        for filepath in files:
            filename = os.path.basename(filepath)
            if filename not in keep_files and 'final' not in filename.lower():
                if os.path.exists(filepath):
                    print(f"  - {filepath}")
                    count += 1
                else:
                    print(f"  - {filepath} (不存在)")
        
        if count == 0:
            print("  （无文件需要删除）")
        else:
            print(f"\n共 {count} 个文件将被删除")
    else:
        deleted_files, count = cleanup_files(files, keep_files)
        
        if count > 0:
            print(f"✅ 已清理 {count} 个临时文件:")
            for f in deleted_files:
                print(f"  - {os.path.basename(f)}")
        else:
            print("✅ 没有需要清理的临时文件")


if __name__ == '__main__':
    main()

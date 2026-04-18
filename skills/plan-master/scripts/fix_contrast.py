#!/usr/bin/env python3
"""
颜色对比度检测和修复工具
用于检测 HTML 中的文字和背景颜色对比度问题，并自动修复不符合 WCAG 标准的元素

使用方法:
    python fix_contrast.py input.html output.html
"""

import sys
import re
from typing import Dict, List, Tuple, Optional
from bs4 import BeautifulSoup


class ColorContrastChecker:
    """颜色对比度检查器"""
    
    # WCAG AA 标准：正常文字 4.5:1，大文字 3:1
    # 使用更宽松的阈值 2.0（只修复严重的对比度问题）
    WCAG_AA_NORMAL = 2.0
    
    # Tailwind 颜色映射表
    TAILWIND_COLORS = {
        'white': '#FFFFFF',
        'black': '#000000',
        'slate-50': '#F8FAFC', 'slate-100': '#F1F5F9', 'slate-200': '#E2E8F0',
        'slate-300': '#CBD5E1', 'slate-400': '#94A3B8', 'slate-500': '#64748B',
        'slate-600': '#475569', 'slate-700': '#334155', 'slate-800': '#1E293B',
        'slate-900': '#0F172A',
        'gray-50': '#F9FAFB', 'gray-100': '#F3F4F6', 'gray-200': '#E5E7EB',
        'gray-300': '#D1D5DB', 'gray-400': '#9CA3AF', 'gray-500': '#6B7280',
        'gray-600': '#4B5563', 'gray-700': '#374151', 'gray-800': '#1F2937',
        'gray-900': '#111827',
        'red-50': '#FEF2F2', 'red-100': '#FEE2E2', 'red-200': '#FECACA',
        'red-300': '#FCA5A5', 'red-400': '#F87171', 'red-500': '#EF4444',
        'red-600': '#DC2626', 'red-700': '#B91C1C', 'red-800': '#991B1B',
        'red-900': '#7F1D1D',
        'blue-50': '#EFF6FF', 'blue-100': '#DBEAFE', 'blue-200': '#BFDBFE',
        'blue-300': '#93C5FD', 'blue-400': '#60A5FA', 'blue-500': '#3B82F6',
        'blue-600': '#2563EB', 'blue-700': '#1D4ED8', 'blue-800': '#1E40AF',
        'blue-900': '#1E3A8A',
        'green-50': '#F0FDF4', 'green-100': '#DCFCE7', 'green-200': '#BBF7D0',
        'green-300': '#86EFAC', 'green-400': '#4ADE80', 'green-500': '#22C55E',
        'green-600': '#16A34A', 'green-700': '#15803D', 'green-800': '#166534',
        'green-900': '#14532D',
        'emerald-50': '#ECFDF5', 'emerald-100': '#D1FAE5', 'emerald-200': '#A7F3D0',
        'emerald-300': '#6EE7B7', 'emerald-400': '#34D399', 'emerald-500': '#10B981',
        'emerald-600': '#059669', 'emerald-700': '#047857', 'emerald-800': '#065F46',
        'emerald-900': '#064E3B',
        'indigo-50': '#EEF2FF', 'indigo-100': '#E0E7FF', 'indigo-200': '#C7D2FE',
        'indigo-300': '#A5B4FC', 'indigo-400': '#818CF8', 'indigo-500': '#6366F1',
        'indigo-600': '#4F46E5', 'indigo-700': '#4338CA', 'indigo-800': '#3730A3',
        'indigo-900': '#312E81',
        'amber-50': '#FFFBEB', 'amber-100': '#FEF3C7', 'amber-200': '#FDE68A',
        'amber-300': '#FCD34D', 'amber-400': '#FBBF24', 'amber-500': '#F59E0B',
        'amber-600': '#D97706', 'amber-700': '#B45309', 'amber-800': '#92400E',
        'amber-900': '#78350F',
        'yellow-50': '#FEFCE8', 'yellow-100': '#FEF9C3', 'yellow-200': '#FEF08A',
        'yellow-300': '#FDE047', 'yellow-400': '#FACC15', 'yellow-500': '#EAB308',
        'yellow-600': '#CA8A04', 'yellow-700': '#A16207', 'yellow-800': '#854D0E',
        'yellow-900': '#713F12',
        'purple-50': '#FAF5FF', 'purple-100': '#F3E8FF', 'purple-200': '#E9D5FF',
        'purple-300': '#D8B4FE', 'purple-400': '#C084FC', 'purple-500': '#A855F7',
        'purple-600': '#9333EA', 'purple-700': '#7E22CE', 'purple-800': '#6B21A8',
        'purple-900': '#581C87',
    }
    
    @staticmethod
    def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
        """将十六进制颜色转换为 RGB"""
        if not hex_color:
            return (0, 0, 0)
        try:
            hex_color = hex_color.lstrip('#')
            if len(hex_color) == 3:
                hex_color = ''.join([c*2 for c in hex_color])
            return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        except (ValueError, AttributeError, TypeError):
            return (0, 0, 0)
    
    @staticmethod
    def rgb_to_luminance(r: int, g: int, b: int) -> float:
        """计算颜色的相对亮度（根据 WCAG 标准）"""
        r, g, b = r / 255.0, g / 255.0, b / 255.0
        
        def adjust(c):
            return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
        
        r, g, b = adjust(r), adjust(g), adjust(b)
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
    
    @classmethod
    def calculate_contrast_ratio(cls, color1: str, color2: str) -> float:
        """计算两个颜色之间的对比度"""
        rgb1 = cls.hex_to_rgb(color1)
        rgb2 = cls.hex_to_rgb(color2)
        
        l1 = cls.rgb_to_luminance(*rgb1)
        l2 = cls.rgb_to_luminance(*rgb2)
        
        if l1 < l2:
            l1, l2 = l2, l1
        
        return (l1 + 0.05) / (l2 + 0.05)
    
    @classmethod
    def parse_tailwind_color(cls, class_str: str, color_type: str) -> Tuple[Optional[str], Optional[str]]:
        """从 Tailwind CSS 类名中解析颜色"""
        classes = class_str.split()
        
        for class_name in classes:
            if class_name.startswith(f'{color_type}-'):
                color_name = class_name[len(f'{color_type}-'):]
                if '/' in color_name:
                    color_name = color_name.split('/')[0]
                if color_name in cls.TAILWIND_COLORS:
                    return cls.TAILWIND_COLORS[color_name], color_name
                else:
                    return None, color_name
        
        # 对于渐变背景，尝试提取 from- 颜色
        if color_type == 'bg':
            for class_name in classes:
                if class_name.startswith('from-'):
                    color_name = class_name[5:]
                    if color_name in cls.TAILWIND_COLORS:
                        return cls.TAILWIND_COLORS[color_name], color_name
        
        return None, None
    
    @classmethod
    def get_best_text_color(cls, bg_color: str) -> str:
        """根据背景色选择最佳的文字颜色"""
        contrast_with_black = cls.calculate_contrast_ratio(bg_color, '#000000')
        contrast_with_white = cls.calculate_contrast_ratio(bg_color, '#FFFFFF')
        
        if contrast_with_black > contrast_with_white:
            return 'text-black'
        else:
            return 'text-white'
    
    @classmethod
    def fix_html_contrast(cls, html: str) -> Tuple[str, Dict]:
        """修复 HTML 中的颜色对比度问题"""
        soup = BeautifulSoup(html, 'html.parser')
        
        stats = {
            'total_checked': 0,
            'total_fixed': 0,
            'issues_found': []
        }
        
        def check_and_fix(element, parent_text_color=None, parent_bg_color=None):
            if not hasattr(element, 'name') or element.name is None:
                return parent_text_color, parent_bg_color

            class_str = element.get('class', [])
            if isinstance(class_str, list):
                class_str = ' '.join(class_str)

            current_bg_color, current_bg_name = cls.parse_tailwind_color(class_str, 'bg')
            current_text_color, current_text_name = cls.parse_tailwind_color(class_str, 'text')

            effective_bg_color = current_bg_color if current_bg_color else parent_bg_color
            effective_text_color = current_text_color if current_text_color else parent_text_color

            # 检查半透明背景
            has_transparent_bg = False
            if current_bg_color:
                for class_name in class_str.split():
                    if class_name.startswith('bg-') and '/' in class_name:
                        has_transparent_bg = True
                        break

            # 检查并修复对比度
            if current_bg_color and effective_text_color and not has_transparent_bg:
                stats['total_checked'] += 1
                contrast_ratio = cls.calculate_contrast_ratio(effective_text_color, current_bg_color)
                
                if contrast_ratio < cls.WCAG_AA_NORMAL:
                    best_text_color = cls.get_best_text_color(current_bg_color)
                    new_classes = [c for c in class_str.split() 
                                   if not c.startswith('text-') or c.startswith('text-[')]
                    new_classes.append(best_text_color)
                    element['class'] = new_classes

                    stats['total_fixed'] += 1
                    stats['issues_found'].append({
                        'element': element.name,
                        'original_classes': class_str,
                        'fixed_classes': ' '.join(new_classes),
                        'contrast_ratio': contrast_ratio
                    })

            # 检查继承的文字色与父背景色冲突
            elif current_text_color and not current_bg_color and not current_bg_name and parent_bg_color:
                parent_element = element.parent
                skip_check = False
                if parent_element and hasattr(parent_element, 'get'):
                    parent_class_str = parent_element.get('class', [])
                    if isinstance(parent_class_str, list):
                        parent_class_str = ' '.join(parent_class_str)
                    if 'gradient' in parent_class_str:
                        skip_check = True

                if not skip_check:
                    stats['total_checked'] += 1
                    contrast_ratio = cls.calculate_contrast_ratio(current_text_color, parent_bg_color)

                    if contrast_ratio < cls.WCAG_AA_NORMAL:
                        best_text_color = cls.get_best_text_color(parent_bg_color)
                        new_classes = [c for c in class_str.split() 
                                       if not c.startswith('text-') or c.startswith('text-[')]
                        new_classes.append(best_text_color)
                        element['class'] = new_classes

                        stats['total_fixed'] += 1
                        stats['issues_found'].append({
                            'element': element.name,
                            'original_classes': class_str,
                            'fixed_classes': ' '.join(new_classes),
                            'contrast_ratio': contrast_ratio
                        })

            # 递归处理子元素
            if has_transparent_bg:
                next_bg_color = parent_bg_color
            elif current_bg_name and not current_bg_color:
                next_bg_color = None
            else:
                next_bg_color = current_bg_color if current_bg_color else parent_bg_color
            next_text_color = effective_text_color

            for child in element.children:
                check_and_fix(child, next_text_color, next_bg_color)

            return effective_text_color, effective_bg_color
        
        body = soup.find('body')
        if body:
            check_and_fix(body)
        
        return str(soup), stats


def main():
    if len(sys.argv) < 3:
        print("使用方法: python fix_contrast.py input.html output.html")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    with open(input_file, 'r', encoding='utf-8') as f:
        html = f.read()
    
    checker = ColorContrastChecker()
    fixed_html, stats = checker.fix_html_contrast(html)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(fixed_html)
    
    print(f"✅ 颜色对比度检查完成:")
    print(f"   检查了 {stats['total_checked']} 个元素")
    print(f"   修复了 {stats['total_fixed']} 个问题")
    
    if stats['issues_found']:
        print("\n修复详情:")
        for issue in stats['issues_found']:
            print(f"   - <{issue['element']}>: 对比度 {issue['contrast_ratio']:.2f}:1")


if __name__ == '__main__':
    main()

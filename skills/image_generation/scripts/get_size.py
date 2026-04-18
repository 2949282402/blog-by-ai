"""
图片尺寸信息处理工具
"""

import re
from typing import List


@staticmethod
def check_aspect_ratio(ratios: List, width: int, height: int) -> dict:
    """检查图片宽高比是否在gemini 要求的比例范围内"""
    # 计算当前宽高比
    current_ratio = width / height

    # 检查每个预定义比例
    for ratio in ratios:
        w, h = map(int, ratio.split(':'))
        target_ratio = w / h
        # 允许小的误差（0.05）
        if abs(current_ratio - target_ratio) < 0.05:
            return {
                'is_match': True,
                'matched_ratio': ratio,
                'current_ratio': round(current_ratio, 2)
            }
    return {
        'is_match': False,
        'matched_ratio': None,
        'current_ratio': round(current_ratio, 2)
    }


def get_image_size(self, image_info: dict) -> dict:
    """根据输入图片尺寸信息获取模型需要的图片尺寸信息"""
    # 正则检验尺寸必须是"1024x1024" 这种形式
    regex = r'^(\d+)[xX](\d+)$'
    is_gemini = False
    # gemi3 要的数据格式
    default_image_config = {
        "image_size": '2K',
    }

    image_config = default_image_config
    radio = image_info.get('radio') or ''
    image_size: str = (image_info.get('image_size') or
                      default_image_config.get('image_size') or '2K')
    match = re.match(regex, radio)
    ratios = ['9:16', '2:3', '3:4', '4:5', '1:1', '5:4', '4:3', '3:2', '16:9']

    if match:
        width = int(match.group(1))
        height = int(match.group(2))
        data = self.check_aspect_ratio(ratios, width, height)
        # 获取gemi 需要的尺寸信息
        if data.get('is_match') and data.get('matched_ratio'):
            is_gemini = True
            image_config = {
                'aspect_ratio': data.get('matched_ratio'),
                'image_size': default_image_config.get('image_size')
            }
            image_size = radio or image_size
        else:
            is_gemini = False
            image_size = radio or image_size
    else:
        is_gemini = True
        image_config = default_image_config
    return {
        'is_gemini': is_gemini,
        'image_size': image_size,
        'image_config': image_config
    }
# MCP 服务调用详解

本文档详细说明 MCP 服务的调用方式、参数映射和工具选择逻辑。

---

## 前置步骤：获取尺寸信息

在调用MCP工具之前，**必须优先调用 `get_image_size` 方法**获取模型需要的尺寸配置信息。

### 调用方式

```python
from scripts.get_size import get_image_size

# image_info 是提取的尺寸参数
image_info = {"radio": "1024x1024", "image_size": "2K"}
result = get_image_size(image_info)
```

### 返回结果

```python
{
    'is_gemini': True,  # 是否符合Gemini要求的比例
    'image_size': "2K",  # 图片尺寸规格
    'image_config': {    # 图片配置信息
        'aspect_ratio': '1:1',
        'image_size': '2K'
    }
}
```

### 字段说明

| 字段                        | 类型 | 说明                                                |
| --------------------------- | ---- | --------------------------------------------------- |
| `is_gemini`                 | bool | 是否符合Gemini模型要求的宽高比                      |
| `image_size`                | str  | 图片尺寸，优先使用radio值，否则使用image_size值     |
| `image_config`              | dict | 图片配置信息，包含aspect_ratio和image_size          |
| `image_config.aspect_ratio` | str  | 匹配的宽高比（如"16:9"），仅当is_gemini为True时有值 |
| `image_config.image_size`   | str  | 默认的图片尺寸规格（"1K"/"2K"/"4K"）                |

---

## 辅助工具：scripts/get_size.py

本 skill 提供了 `scripts/get_size.py` 脚本工具，用于检查图片宽高比和获取尺寸信息。

**脚本位置**：`workspace/skills/image_generation/scripts/get_size.py`

### 使用示例

```python
from scripts.get_size import check_aspect_ratio, get_image_size

# 方式1: 检查宽高比
result = check_aspect_ratio(["1:1", "16:9"], 1920, 1080)
# 返回: {'is_match': True, 'matched_ratio': '16:9', 'current_ratio': 1.78}

# 方式2: 获取图片尺寸信息（推荐）
image_info = {"radio": "1920x1080", "image_size": "2K"}
result = get_image_size(image_info)
# 返回: {'is_gemini': True, 'image_size': '1920x1080', 'image_config': {'aspect_ratio': '16:9', 'image_size': '2K'}}
```

---

## MCP 工具概览

图像生成通过调用 `multimodal-model` MCP 服务，提供两个生图工具：

1. **generate_image_model1_with_watermark** (优先调用)
2. **generate_image_model2_with_watermark** (降级调用)

---

## MCP工具调用优先级

根据 `get_image_size` 返回的 `is_gemini` 字段，决定调用哪个MCP工具。

### 调用逻辑流程

```
步骤1：调用 get_image_size 获取尺寸信息
  └─ 返回 size_result，包含 is_gemini 字段

步骤2：根据 is_gemini 判断调用哪个工具
  ├─ 如果 is_gemini == True
  │  ├─ 优先调用 generate_image_model1_with_watermark (MCP工具1)
  │  ├─ 如果调用失败 OR 返回图片链接为空
  │  └─ 降级调用 generate_image_model2_with_watermark (MCP工具2)
  │
  └─ 如果 is_gemini == False
     └─ 直接调用 generate_image_model2_with_watermark (MCP工具2)
```

### 调用逻辑代码示例

```python
# 1. 获取尺寸信息
image_info = {"radio": "1920x1080", "image_size": "2K"}
size_result = get_image_size(image_info)

# 2. 根据is_gemini选择工具
if size_result['is_gemini']:
    # 优先使用MCP工具1
    image_url = call_generate_image_model1_with_watermark(
        prompt=prompt,
        aspectRatio=size_result['image_config']['aspect_ratio'],
        imageSize=size_result['image_size'],
        referenceImageUrls=reference_urls
    )

    # 如果调用失败或返回为空，降级到MCP工具2
    if not image_url:
        image_url = call_generate_image_model2_with_watermark(
            prompt=prompt,
            size=size_result['image_size'],
            referenceImageUrls=reference_urls
        )
else:
    # 直接使用MCP工具2
    image_url = call_generate_image_model2_with_watermark(
        prompt=prompt,
        size=size_result['image_size'],
        referenceImageUrls=reference_urls
    )
```

### 调用优先级总结

| is_gemini值 | 优先调用工具                                   | 降级调用工具                                   |
| ----------- | ---------------------------------------------- | ---------------------------------------------- |
| `True`      | `generate_image_model1_with_watermark` (工具1) | `generate_image_model2_with_watermark` (工具2) |
| `False`     | `generate_image_model2_with_watermark` (工具2) | 无（不调用工具1）                              |

### 降级调用条件

- MCP工具1调用失败（网络错误、服务异常等）
- MCP工具1返回的图片链接为空或无效

---

## MCP 工具 1: generate_image_model1_with_watermark

### 参数映射关系

| MCP参数              | 对应skill模块                      | 说明                                                                                    | 示例值                                                                                      |
| -------------------- | ---------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `prompt`             | 提示词智能提取                     | 图像生成提示词，从提示词数组中取单个元素                                                | `"一只可爱的猫咪在阳光下睡觉。图片上不要加Tbox AI 生成水印和其他任何水印"`                  |
| `aspectRatio`        | 尺寸参数提取 + get_image_size      | 图片宽高比，优先从 `get_image_size` 返回的 `image_config.aspect_ratio` 获取             | `"16:9"` 或 `"1:1"` 或 `"9:16"`                                                             |
| `imageSize`          | 尺寸参数提取 + get_image_size      | 图片尺寸规格，使用 `get_image_size` 返回的 `image_size` 参数                            | `"1K"` 或 `"2K"` 或 `"4K"`                                                                  |
| `referenceImageUrls` | 用户提供的参考图或上一轮生成的图片 | 参考图片的URL列表，图生图时必填。来源包括：1)用户提供的参考图URL；2)上一轮生成的图片URL | `["https://example.com/reference.jpg"]` 或 `["https://mdn.alipayobjects.com/.../original"]` |

### 参数映射逻辑

```python
# 1. 先调用 get_image_size 获取尺寸配置
image_info = {"radio": "1920x1080", "image_size": "2K"}
size_result = get_image_size(image_info)

# 2. 根据返回结果映射参数
mcp_params = {
    "prompt": "提示词内容",
    "aspectRatio": size_result['image_config'].get('aspect_ratio'),  # 如 "16:9"
    "imageSize": size_result['image_size'],  # 如 "2K"
    "referenceImageUrls": ["参考图URL"]  # 仅类型3（图生图）需要
}
```

---

## MCP 工具 2: generate_image_model2_with_watermark

### 参数映射关系

| MCP参数              | 对应skill模块                      | 说明                                                                                    | 示例值                                                                                      |
| -------------------- | ---------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `prompt`             | 提示词智能提取                     | 图像生成提示词，从提示词数组中取单个元素                                                | `"一只可爱的猫咪在阳光下睡觉。图片上不要加Tbox AI 生成水印和其他任何水印"`                  |
| `size`               | 尺寸参数提取 + get_image_size      | 图片尺寸，使用 `get_image_size` 返回的 `image_size` 参数                                | `"1024x1024"` 或 `"1920x1080"` 或 `"2K"`                                                    |
| `referenceImageUrls` | 用户提供的参考图或上一轮生成的图片 | 参考图片的URL列表，图生图时必填。来源包括：1)用户提供的参考图URL；2)上一轮生成的图片URL | `["https://example.com/reference.jpg"]` 或 `["https://mdn.alipayobjects.com/.../original"]` |

### 参数映射逻辑

```python
# 1. 先调用 get_image_size 获取尺寸配置
image_info = {"radio": "1024x1024", "image_size": "2K"}
size_result = get_image_size(image_info)

# 2. 根据返回结果映射参数
mcp_params = {
    "prompt": "提示词内容",
    "size": size_result['image_size'],  # 如 "1024x1024" 或 "2K"
    "referenceImageUrls": ["参考图URL"]  # 仅类型3（图生图）需要
}
```

---

## 调用次数说明

根据提示词智能提取的类型确定调用次数：

| 类型            | 说明                   | 调用次数                                           |
| --------------- | ---------------------- | -------------------------------------------------- |
| 类型1（宫格）   | 单个提示词描述宫格布局 | 1次                                                |
| 类型2（差异化） | 多个不同的提示词       | N次（等于数组长度）                                |
| 类型3（图生图） | 单个图生图提示词       | 1次（需要传入参考图URL，可能来自用户或上一轮生成） |
| 类型4（常规）   | 多个相同或相似的提示词 | N次（等于数组长度）                                |

---

## 常见错误示例

### ❌ 错误：用户上传图片但识别为常规生图

```bash
# 用户请求：[上传了一张图片] 生成一张春节海报
# 错误：识别为类型4（常规生图），没有获取参考图

# 错误调用（缺少referenceImageUrls参数）：
mcporter call multimodal-model.generate_image_model1_with_watermark \
  --args '{"prompt": "春节海报", "size": "1024x1024"}'

# 结果：生成了一张全新的春节海报，没有参考用户上传的图片
```

### ✅ 正确做法

```bash
# 正确：识别为类型3（图生图），提取用户上传的图片URL
mcporter call multimodal-model.generate_image_model1_with_watermark \
  --args '{
    "prompt": "基于参考图生成春节海报，保持原图风格和元素",
    "size": "1024x1024",
    "referenceImageUrls": ["https://user-uploaded.example.com/image.jpg"]
  }'

# 结果：基于用户上传的图片生成春节海报，保留了原图的风格和元素
```

**关键提示**：
- 用户上传图片时，**必须优先检查图片附件**，无论用户描述如何
- 详细的类型识别优先级见[提示词类型详细说明](prompt_types.md#意图识别流程)
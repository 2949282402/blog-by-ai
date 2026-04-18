---
name: html-report
description: 生成可视化 HTML 报告。指导模型分步骤生成精美网页：内容补充搜索→生成 HTML→补图→检查优化→页面部署。包含完整的 TailwindCSS 规范和踩坑经验。
---

# HTML Report Generator

当用户需要生成 HTML 报告、可视化页面、数据展示页面时使用此 skill。

## 生成流程（必须按顺序执行）

### Step 0: 准备工作

#### 0.1 环境检测（首次执行）

```bash
python scripts/check_env.py
```

> 自动检测 Python 环境和依赖，缺失时自动安装。

#### 0.2 内容补充搜索（可选）

**触发条件**：当用户提供的内容、数据、素材不足时执行。

使用 `web_search` 工具搜索补充内容：
- 行业背景、市场数据
- 案例研究、最佳实践
- 相关技术趋势

---

### Step 1: 生成 HTML 页面

根据用户需求生成**完整的 HTML 页面**：

> 💡 **说明**：此步骤生成的是最终效果的 HTML，所有内容、布局、样式都是完整的，只有图片位置使用占位符 `__PLACEHOLDER__`，将在 Step 2 中替换为真实图片。

#### 生成要求（必须遵守）

1. **TailwindCSS 原子类**：通过 `<script src="https://cdn.tailwindcss.com"></script>` 引入，严禁自定义 CSS 类名
2. **颜色对比度**：文字与背景对比度 ≥ 4.5:1（WCAG AA 标准）
3. **禁止无功能交互**：按钮、链接必须有实际功能，否则不要添加
4. **图片占位符格式**：
   ```html
   <img src="__PLACEHOLDER__" data-query="图片描述" alt="图片描述" />
   ```

> 📖 完整规范见下方《HTML 生成规范》章节

#### 执行步骤

1. **理解需求**：分析用户提供的内容、数据、设计要求
2. **优先使用用户素材**：
   - 如果用户提供了图片文件或 URL，直接使用用户图片，不使用占位符
   - 如果用户提供了其他素材（文案、数据等），充分整合到页面中
3. **生成 HTML**：使用 TailwindCSS 原子类，遵循下方的《HTML 生成规范》
4. **图片占位**：只有在用户未提供足够图片时，才使用占位符格式


### Step 2: 补充图片（使用 web_search.image_replace 工具）

检查生成的 HTML 中所有 `__PLACEHOLDER__` 占位符，使用 `web_search.image_replace` 工具生成图片：

**操作：**
1. 遍历所有 `__PLACEHOLDER__` 占位符
2. 调用 `web_search.image_replace` 工具生成图片
3. 传入参数：
   - `query`: `data-query` 中的图片描述
   - `description`: 基于 `data-query` 生成的详细图片需求描述
   - `style`: 根据页面主题选择的图片风格（如："modern"、"minimal"、"professional"）
4. 工具返回图片 URL 后，替换占位符

**示例调用：**
```
image_replace(
  query="团队会议场景",
  description="一个现代化的办公室会议室，团队成员正在讨论，白板上有图表，明亮的灯光",
  style="professional"
)
```

**重要说明：**
- 此步骤只处理占位符，不再检查或使用用户提供的图片
- 所有用户提供的图片已在 Step 1 中直接使用
   - 添加文字说明："图片占位"

### Step 3: 页面优化

完成 HTML 生成和图片补充后，执行以下优化确保页面质量：

#### 3.1 确保字体正常加载

将字体 CDN 替换为国内加速镜像，避免加载缓慢或失败：

```bash
python scripts/fix_fonts.py <输入文件> <输出文件>
```

#### 3.2 优化视觉对比度

自动检测并修复文字与背景对比度不足的问题，确保可读性：

```bash
python scripts/fix_contrast.py <输入文件> <输出文件>
```

#### 3.3 清理图片占位符（如有需要）

移除未能替换的图片占位符，保持页面整洁：

```bash
python scripts/clean_placeholders.py <输入文件> <输出文件>
```

#### 3.4 清理临时文件

删除本次流程中创建的临时文件，只保留最终文件：

```bash
python scripts/cleanup.py <临时文件1> <临时文件2> ... --keep <最终文件>
```

### 检查清单

- [ ] 字体加载正常（已执行 fix_fonts.py）
- [ ] 视觉对比度达标（已执行 fix_contrast.py）
- [ ] 无残留占位符
- [ ] HTML 结构完整
- [ ] 响应式布局正常

### Step 4: 页面部署

使用 `cloud-alipay.html_deploy` 工具将页面部署到云端，向用户提供可访问的 URL。

> ⚠️ **重要**：`html_list` 参数必须传入 **HTML 内容字符串列表**，而不是文件路径列表！
> 
> 正确做法：先使用 `read_file` 读取 HTML 文件内容，然后将内容作为字符串传入 `html_list` 参数。

> 
> **如果部署失败**（报错 `Input should be a valid list`），请：
> 1. 将最终 HTML 文件提供给用户
> 2. 告知用户可以手动部署或使用其他方式访问

**正确调用示例**：
```
1. 先读取文件内容：read_file("report-final.html")
2. 将读取到的 HTML 内容作为字符串传入：
   cloud-alipay.html_deploy(html_list=["<!DOCTYPE html>...完整HTML内容...</html>"])
```

**错误调用示例**（会导致部署的页面只显示文件路径）：
```
❌ cloud-alipay.html_deploy(html_list=["/path/to/report.html"])
```

**部署成功后提供**：
- 可访问的 URL
- 页面内容概述

**部署失败时**：确保用户至少能获得完整的 HTML 文件路径，用户可以在本地浏览器中打开查看。

---

## HTML 生成规范

> 📖 **参考说明**：Step 1 中已内嵌关键规范，以下是完整的详细规范，供深入参考。
>
> 以下是经过大量踩坑总结的 HTML 生成规范，必须严格遵守。

### ⚠️ 关键约束（必须遵守）

1. **用户需求至上**：用户明确要求优先级最高，必须严格执行
2. **严格基于事实**：禁止编造任何内容，所有信息必须来自提供的材料
3. **文档深度利用**：充分展开所有提供的材料，避免空洞
4. **TailwindCSS 原子类**：禁止自定义类名和 CSS
5. **无功能元素禁止**：所有交互元素必须有完整实现

### TailwindCSS 使用规范（重要）

- **必须使用 TailwindCSS 原子类实现所有样式，严禁自定义 CSS 类名**
- **通过 `<script src="https://cdn.tailwindcss.com"></script>` 引入**
- **严禁使用自定义类名**（如 `section`、`card`、`button`）
- **严禁在 `<style>` 标签中编写自定义 CSS**
- **背景色设置（关键）**：根据主题选择合适背景色（如 `bg-white`、`bg-gray-50`），严禁省略

### TailwindCSS 布局方法优先级

1. **Flexbox（首选）**：大多数一维布局（导航栏、卡片等）
2. **CSS Grid（次选）**：复杂二维网格布局（画廊、仪表板等）
3. **Float/Absolute（避免）**：除非绝对必要

### TailwindCSS 间距使用规范

- **优先使用标准刻度**：`p-4`、`mx-2`，禁止任意值（`p-[16px]`）
- **gap 类优先**：Flexbox/Grid 容器使用 `gap-4` 等
- **禁止混用**：同一元素禁止同时使用 margin/padding 和 gap
- **禁止 space-* 类**：用 gap 替代

### 响应式设计规范（移动优先）

- **移动优先**：从移动端（320px-768px）开始设计
- **断点**：sm(640px)、md(768px)、lg(1024px)、xl(1280px)
- **示例**：`text-base md:text-lg lg:text-xl`

### 颜色对比度规则（必须遵守）

- **任何有背景色的元素，必须明确设置文字颜色**
- 确保文字与背景对比度达到 4.5:1（WCAG AA 标准）
- 浅色背景 → 深色文字（text-gray-900、text-black）
- 深色背景 → 浅色文字（text-white、text-gray-100）
- 半透明背景：计算最终颜色后选择合适文字色
- **特别注意继承**：父元素的文字色可能与子元素背景色冲突

### 色彩使用原则

- **总色彩数量**：3-5 种主色（不含透明度变化）
- **色彩结构**：1 个主题色 + 2-3 个中性色（白、灰、黑系） + 1-2 个强调色
- **智能选择**：深入理解内容主题或图片风格，选择能传达正确情感和氛围的颜色

### 渐变使用（适度开放）

- **可以使用渐变**来增强视觉吸引力，但需克制
- 优先用于背景、大标题等主要视觉元素
- 使用类似色或同色系渐变（如：紫→粉、橙→红）
- 避免对立色渐变（如：粉→绿、冷暖色混合）
- 渐变色标控制在 2-3 个

---

## 交互体验规范（严格执行）

### 核心原则：功能实现优先，严禁装饰性交互

**页面类型与交互策略**：
- **内容展示类页面**：以静态展示为主，避免添加交互元素
- **功能工具类页面**：提供完整的交互功能，确保每个交互都可用
- **混合类页面**：只在有明确功能需求时添加交互元素

### 🚫 绝对禁止以下无实际功能的交互元素

1. **无效的锚点链接**
   - ❌ 禁止：`<a href="#section1">` 但页面中不存在 `id="section1"` 的元素
   - ❌ 禁止：`<a href="#">返回顶部</a>` 如果没有配套的 JavaScript 滚动功能
   - ✅ 允许：锚点链接 **当且仅当** 目标元素确实存在且 id 完全匹配

2. **无功能的按钮**
   - ❌ 禁止：任何没有 JavaScript 功能的 `<button>` 元素
   - ❌ 禁止：`<button>立即订阅</button>` 但没有订阅表单或处理逻辑
   - ❌ 禁止：`<button>了解更多</button>` 但不跳转也不展开内容
   - ✅ 允许：有完整 JavaScript 功能实现的按钮

3. **假的表单提交**
   - ❌ 禁止：`<form>` 没有实际的提交处理逻辑
   - ✅ 允许：功能性表单 **当且仅当** 有完整的 JavaScript 处理逻辑

4. **无效的导航链接**
   - ❌ 禁止：`<a href="#">` 或 `<a href="javascript:void(0)">` 等空链接
   - ❌ 禁止：`<a href="/products">` 等不存在的页面路径
   - ✅ 允许：外部真实 URL **当且仅当** 用户明确提供了链接地址

**记住：宁可少一个交互元素，也不要添加无功能的装饰性按钮。**

---

## 现代化视觉设计指南

**核心设计理念**：
- **内容为王**：设计服务于内容，而非装饰堆砌
- **实用美学**：每个视觉元素都应有明确的功能价值
- **现代简约**：通过留白、层次、色彩对比实现视觉吸引力

**如何打造现代化页面**：

1. **空间与留白**
   - 充分利用留白（padding、margin）营造呼吸感
   - 使用 TailwindCSS 间距：`p-6 md:p-8 lg:p-12` 等
   - 避免内容过于密集，给视觉留出思考空间

2. **层次与深度**
   - 使用 shadow 创建层次：`shadow-sm`、`shadow-md`、`shadow-lg`
   - 通过卡片分组相关内容：`bg-white rounded-lg shadow-md p-6`
   - 使用边框和背景色区分不同区域

3. **排版与节奏**
   - 标题层级清晰：`text-3xl md:text-4xl lg:text-5xl font-bold`
   - 正文易读：`text-base md:text-lg leading-relaxed`
   - 使用粗细对比（font-weight）营造节奏感

4. **交互反馈**
   - 悬停效果：`hover:shadow-lg hover:scale-105 transition-all duration-300`
   - 过渡动画：`transition-all duration-200`
   - 状态变化明确可见

**避免事项**：
- 避免无意义的装饰元素（如抽象渐变圆圈、模糊方块）
- 避免使用 emoji 替代专业图标
- 避免过度复杂的 SVG 装饰插图

---

## 图片占位符规范

### 占位符格式

```html
<img 
  src="__PLACEHOLDER__" 
  data-query="图片的自然语言描述" 
  data-ratio="16:9"
  data-from="配图"
  alt="图片描述"
  class="w-full h-auto object-contain rounded-lg"
/>
```

### 属性说明

| 属性 | 必填 | 说明 |
|------|------|------|
| `src` | ✅ | 固定为 `__PLACEHOLDER__` |
| `data-query` | ✅ | 图片的自然语言描述，用于搜索/生成 |
| `data-ratio` | ❌ | 图片比例，如 `16:9`、`4:3`、`1:1` |
| `data-from` | ❌ | 图片来源类型：`配图`、`信息`、`图表` |
| `alt` | ✅ | 无障碍描述文本 |

### 图片样式规范

- **object-fit**：必须设为 `object-contain`，避免图片变形
- **圆角**：使用 `rounded-lg` 或 `rounded-xl`
- **响应式**：使用 `w-full h-auto` 或固定高度容器

---

## 页面结构要求

- **Footer 必须存在**：宽度撑满，高度 100px，黑底白字
- **Footer 内容**：`页面内容均由 AI 生成，仅供参考`

---

## 字体加载规范

- **禁止使用 @import 加载字体**（避免 CSS 渲染阻塞）
- **推荐 CDN**：`https://fonts.loli.net`（国内加速）
- **加载方式**：在 `<head>` 中使用 `<link>` 标签
- **推荐字体**：`Inter` + `Noto Sans SC`（现代、清晰）

```html
<link rel="preconnect" href="https://fonts.loli.net">
<link href="https://fonts.loli.net/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
```

---

## Chart.js 图表使用规范

**创建图表时使用 Chart.js**：

```html
<script src="https://gw.alipayobjects.com/os/lib/chart.js/3.9.1/dist/chart.min.js"></script>
```

**关键配置**：
- 必须设置 `maintainAspectRatio: false`
- 为 canvas 创建明确高度的父容器

```html
<div class="h-64">
  <canvas id="myChart"></canvas>
</div>
<script>
new Chart(document.getElementById('myChart'), {
  type: 'bar',
  data: { /* ... */ },
  options: {
    maintainAspectRatio: false,
    responsive: true
  }
});
</script>
```

---

## 动画使用规范

**默认策略：保持克制，避免过度使用**

**何时使用**：
- 用户明确要求时（必须实现）
- 营销/展示类页面（适度增强吸引力）
- 交互反馈（悬停、点击状态变化）

**何时避免**：
- 工具/功能类页面（优先功能体验）
- 内容展示类页面（避免干扰阅读）
- 复杂或影响性能的动画

**实现原则**：
- 使用 CSS transition/animation 而非 JS
- 动画时长简短（200-300ms）
- 不影响性能和可访问性

---

## 其他技术要求

- 使用 HTML5 语义化标签
- 代码清晰，易维护
- 响应式适配，优化移动端
- **JavaScript 限制**：严禁使用 while 循环

---

## 自检清单（输出前必检）

### P0：内容质量（最高优先级）
- [ ] **文档信息**：是否充分利用所有提供的材料？（不能只罗列标题）
- [ ] **用户需求**：是否严格执行用户所有要求？

### P1：技术规范
- [ ] **TailwindCSS**：是否全部使用原子类？无自定义类名？
- [ ] **颜色对比度**：文字和背景对比度是否达标（4.5:1）？
- [ ] **body 背景色**：是否设置了背景色？

### P2：交互合规
- [ ] **按钮**：所有按钮是否都有完整功能？
- [ ] **锚点**：所有锚点目标是否存在？
- [ ] **表单**：是否有完整处理逻辑？
- [ ] **内容展示页**：是否避免了营销按钮、假表单？

### P3：视觉细节
- [ ] **图片 object-fit**：是否全部设为 `contain`？
- [ ] **响应式**：不同尺寸下是否正常？
- [ ] **Footer**：是否符合要求？

---

## 输出要求

**严格要求：**
- **只输出 HTML 代码，不要输出任何其他内容**
- **禁止输出任何解释性文字、说明文字、注释性文字**
- **禁止使用 ```html ``` 等 markdown 代码块标记包裹 HTML**
- **必须直接输出完整的 HTML 内容，从 `<!DOCTYPE html>` 开始到 `</html>` 结束**
- **确保 HTML 内容完整无截断，包含所有必要的结构和内容**

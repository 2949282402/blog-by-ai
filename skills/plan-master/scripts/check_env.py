#!/usr/bin/env python3
"""
环境检测和依赖安装工具
自动检测 Python 环境和依赖，并在需要时尝试安装

使用方法:
    python check_env.py
"""

import sys
import subprocess
import importlib
from typing import Tuple, List


def check_python() -> Tuple[bool, str]:
    """检查 Python 版本"""
    try:
        version = sys.version_info
        if version.major >= 3 and version.minor >= 7:
            return True, f"Python {version.major}.{version.minor}.{version.micro}"
        else:
            return False, f"Python {version.major}.{version.minor}.{version.micro} (需要 3.7+)"
    except Exception as e:
        return False, f"Python 检测失败: {e}"


def check_package(package_name: str, import_name: str = None) -> Tuple[bool, str]:
    """
    检查 Python 包是否已安装

    Args:
        package_name: pip 包名（如 beautifulsoup4）
        import_name: 导入名（如 bs4），默认与 package_name 相同

    Returns:
        (是否安装, 版本信息或错误信息)
    """
    import_name = import_name or package_name

    try:
        module = importlib.import_module(import_name)
        version = getattr(module, '__version__', '未知版本')
        return True, version
    except ImportError:
        return False, f"{package_name} 未安装"
    except Exception as e:
        return False, f"检测失败: {e}"


def install_package(package_name: str) -> Tuple[bool, str]:
    """
    尝试安装 Python 包

    Args:
        package_name: pip 包名

    Returns:
        (是否成功, 详细信息)
    """
    try:
        # 使用 --user 参数安装到用户目录，避免需要 sudo
        result = subprocess.run(
            [sys.executable, '-m', 'pip', 'install', package_name, '--user'],
            capture_output=True,
            text=True,
            timeout=60
        )

        if result.returncode == 0:
            return True, f"✅ {package_name} 安装成功"
        else:
            return False, f"❌ {package_name} 安装失败: {result.stderr}"
    except subprocess.TimeoutExpired:
        return False, f"❌ {package_name} 安装超时"
    except Exception as e:
        return False, f"❌ {package_name} 安装失败: {e}"


def main():
    """主函数：执行环境检测和依赖安装"""
    print("=" * 60)
    print("HTML Report Skill - 环境检测")
    print("=" * 60)

    # 1. 检查 Python
    print("\n[1/3] 检查 Python 环境...")
    python_ok, python_info = check_python()
    if python_ok:
        print(f"✅ Python: {python_info}")
    else:
        print(f"❌ Python: {python_info}")
        print("\n请安装 Python 3.7 或更高版本：")
        print("  macOS:   brew install python3")
        print("  Ubuntu:  sudo apt-get install python3 python3-pip")
        print("  CentOS:  sudo yum install python3 python3-pip")
        sys.exit(1)

    # 2. 检查并安装依赖
    print("\n[2/3] 检查 Python 依赖...")
    required_packages = [
        ('beautifulsoup4', 'bs4'),
    ]

    all_ok = True
    for package_name, import_name in required_packages:
        installed, info = check_package(package_name, import_name)
        if installed:
            print(f"✅ {package_name}: {info}")
        else:
            print(f"⚠️  {package_name}: {info}")
            print(f"   正在尝试安装 {package_name}...")

            success, install_info = install_package(package_name)
            print(f"   {install_info}")

            if success:
                # 再次检查确认安装成功
                installed, info = check_package(package_name, import_name)
                if installed:
                    print(f"   ✅ {package_name}: {info}")
                else:
                    print(f"   ❌ 安装后仍无法检测到 {package_name}")
                    all_ok = False
            else:
                all_ok = False

    if not all_ok:
        print("\n⚠️  部分依赖安装失败，某些功能可能不可用")
        print("你可以手动安装依赖:")
        print(f"  {sys.executable} -m pip install beautifulsoup4 --user")

    # 3. 验证脚本
    print("\n[3/3] 验证脚本可执行性...")
    try:
        # 测试导入依赖
        import bs4
        print("✅ beautifulsoup4 导入成功")
        print("✅ 所有依赖正常，可以执行后续脚本")
    except ImportError as e:
        print(f"❌ 依赖导入失败: {e}")
        print("⚠️  fix_contrast.py 和 clean_placeholders.py 可能无法执行")
        print("但 fix_fonts.py 和 cleanup.py 仍然可用")

    print("\n" + "=" * 60)
    if all_ok:
        print("✅ 环境检测完成，所有依赖正常")
    else:
        print("⚠️  环境检测完成，但存在依赖问题")
    print("=" * 60)

    # 返回状态码：0=全部正常，1=有警告/错误
    return 0 if all_ok else 1


if __name__ == '__main__':
    sys.exit(main())
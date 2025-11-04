#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
JieCool 数据库迁移脚本合并工具
合并 migrations 文件夹中的所有 SQL 脚本为一个文件

使用方法:
    python merge_migrations.py

参数:
    --output FILE    指定输出文件名 (默认: all_migrations.sql)
    --preview       预览文件列表，不实际合并
    --verbose       显示详细输出
"""

import os
import sys
import argparse
from pathlib import Path
from datetime import datetime

def get_sql_files(migrations_dir):
    """获取所有SQL文件并按文件名排序"""
    if not migrations_dir.exists():
        print(f"错误: 找不到 migrations 目录: {migrations_dir}")
        return []

    # 获取所有.sql文件
    sql_files = list(migrations_dir.glob("*.sql"))

    # 按文件名排序
    def get_file_number(filename):
        try:
            # 提取文件名开头的数字
            name = filename.stem
            import re
            match = re.match(r'(\d+)', name)
            return int(match.group(1)) if match else 9999
        except:
            return 9999

    sql_files.sort(key=get_file_number)
    return sql_files

def merge_files(sql_files, output_file, verbose=False):
    """合并所有SQL文件"""
    print(f"开始合并SQL文件到: {output_file}")
    print()

    # 创建输出文件目录
    output_file.parent.mkdir(parents=True, exist_ok=True)

    # 写入文件头
    header = f"""-- ========================================
-- JieCool 数据库迁移脚本合并文件
--
-- 生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
-- 描述: 合并所有迁移脚本为一个文件，便于执行和部署
--
-- 使用方法:
--   psql -h localhost -U jiecool_user -d JieCool -f {output_file.name}
--
-- 注意:
--   1. 请确保数据库已创建
--   2. 请确保用户有足够权限
--   3. 脚本会先删除现有对象再创建，请谨慎使用
-- ========================================

-- 开始执行迁移脚本...

"""

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(header)

        for i, sql_file in enumerate(sql_files, 1):
            if verbose:
                print(f"  [{i}/{len(sql_files)}] 正在合并: {sql_file.name}")

            # 写入分隔符
            f.write("\n-- ========================================\n")
            f.write(f"-- 文件: {sql_file.name}\n")
            f.write("-- ========================================\n\n")

            # 读取并写入SQL文件内容
            try:
                with open(sql_file, 'r', encoding='utf-8') as sf:
                    content = sf.read()
                    f.write(content)

                if verbose:
                    lines = content.count('\n')
                    print(f"      成功合并 ({lines} 行)")

            except Exception as e:
                print(f"      读取失败: {e}")
                f.write(f"-- 错误: 无法读取文件 {sql_file.name}\n")

            f.write(f"\n-- 文件 {sql_file.name} 合并完成\n")

        # 写入文件尾
        footer = f"""
-- ========================================
-- 迁移脚本合并完成
-- 共合并了 {len(sql_files)} 个文件
-- ========================================

-- 提示: 执行前请务必备份数据库
-- 提示: 建议在测试环境先验证脚本正确性
"""
        f.write(footer)

    print(f"合并完成! 生成了 {len(sql_files)} 个文件")

    # 显示文件信息
    if output_file.exists():
        file_size = output_file.stat().st_size
        print(f"输出文件信息:")
        print(f"   文件路径: {output_file}")
        print(f"   文件大小: {file_size:,} 字节 ({file_size/1024:.1f} KB)")

    return True

def preview_files(sql_files):
    """预览文件列表"""
    print("找到的迁移脚本文件:")
    print()

    if not sql_files:
        print("  没有找到任何SQL文件")
        return

    for i, sql_file in enumerate(sql_files, 1):
        # 获取文件大小
        size = sql_file.stat().st_size
        print(f"  {i:2d}. {sql_file.name:<25} ({size:4d} 字节)")

    print(f"\n总计: {len(sql_files)} 个文件")

def main():
    parser = argparse.ArgumentParser(
        description='合并数据库迁移脚本',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  python merge_migrations.py                 # 使用默认输出文件名
  python merge_migrations.py --preview         # 预览文件列表
  python merge_migrations.py --output custom.sql   # 指定输出文件名
  python merge_migrations.py --verbose          # 显示详细输出
        """
    )

    parser.add_argument(
        '--output', '-o',
        default='all_migrations.sql',
        help='指定输出文件名 (默认: all_migrations.sql)'
    )

    parser.add_argument(
        '--preview', '-p',
        action='store_true',
        help='预览文件列表，不实际合并'
    )

    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='显示详细输出'
    )

    args = parser.parse_args()

    # 获取脚本目录
    script_dir = Path(__file__).parent
    migrations_dir = script_dir / 'migrations'
    output_file = script_dir / args.output

    print("=" * 50)
    print("JieCool 数据库迁移脚本合并工具")
    print("=" * 50)
    print(f"源目录: {migrations_dir}")
    print(f"输出文件: {output_file}")
    print()

    # 获取SQL文件列表
    sql_files = get_sql_files(migrations_dir)

    if not sql_files:
        print("没有找到任何SQL文件，脚本退出")
        sys.exit(1)

    # 预览模式
    if args.preview:
        preview_files(sql_files)
        return

    # 合并文件
    try:
        success = merge_files(sql_files, output_file, args.verbose)
        if success:
            print()
            print("下一步操作:")
            print("   1. 检查生成的文件内容")
            print("   2. 如有需要，手动编辑调整")
            print(f"   3. 执行SQL文件: psql -h localhost -U admin -d JieCool -f {args.output}")
            print()
            print("重要提醒:")
            print("   - 执行前请务必备份数据库")
            print("   - 建议先在测试环境验证")
            print("   - 脚本会删除并重建所有对象")
            print()

            # 询问是否查看文件内容
            try:
                choice = input("是否立即查看生成的文件内容? (y/n): ").strip().lower()
                if choice in ['y', 'yes']:
                    print()
                    print("文件内容预览 (前50行):")
                    print("-" * 60)

                    with open(output_file, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                        for i, line in enumerate(lines[:50]):
                            print(f"  {i+1:2d}: {line.rstrip()}")

                    if len(lines) > 50:
                        print(f"  ... (还有 {len(lines)-50} 行)")

                    print("-" * 60)
                    print("文件内容预览结束")
                    print()

            except (KeyboardInterrupt, EOFError):
                print("\n用户取消操作")

    except Exception as e:
        print(f"合并过程中发生错误: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
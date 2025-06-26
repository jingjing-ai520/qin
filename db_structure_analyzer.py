#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据库结构分析器
用于解析DDL文件并按模块分类存储表结构
"""

import os
import re
import json
from typing import Dict, List, Tuple
from pathlib import Path


class DDLAnalyzer:
    """DDL文件分析器"""
    
    def __init__(self):
        self.tables = {}
        self.indexes = {}
        self.constraints = {}
        
    def parse_ddl_file(self, file_path: str) -> Dict:
        """解析DDL文件"""
        print(f"正在解析文件: {file_path}")
        
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # 提取数据库名称
        db_name = self._extract_db_name(file_path)
        
        # 解析表结构
        tables = self._parse_tables(content, db_name)
        
        # 按功能模块分类
        categorized_tables = self._categorize_tables(tables)
        
        return {
            'database': db_name,
            'total_tables': len(tables),
            'tables': tables,
            'categories': categorized_tables
        }
    
    def _extract_db_name(self, file_path: str) -> str:
        """从文件路径提取数据库名称"""
        filename = os.path.basename(file_path)
        return filename.replace('.ddl', '')
    
    def _parse_tables(self, content: str, db_name: str) -> Dict:
        """解析表结构"""
        tables = {}
        
        # 匹配CREATE TABLE语句
        table_pattern = r'CREATE TABLE\s+(\w+)\.(\w+)\s*\((.*?)\)(?=\s*PCTFREE|\s*;)'
        matches = re.finditer(table_pattern, content, re.DOTALL | re.IGNORECASE)
        
        for match in matches:
            schema = match.group(1)
            table_name = match.group(2)
            columns_text = match.group(3)
            
            # 解析列信息
            columns = self._parse_columns(columns_text)
            
            tables[table_name] = {
                'schema': schema,
                'name': table_name,
                'columns': columns,
                'column_count': len(columns)
            }
        
        return tables
    
    def _parse_columns(self, columns_text: str) -> List[Dict]:
        """解析列信息"""
        columns = []
        
        # 简化的列解析，匹配列定义
        column_lines = [line.strip() for line in columns_text.split(',') if line.strip()]
        
        for line in column_lines:
            line = line.strip()
            if not line or line.startswith('CONSTRAINT'):
                continue
                
            # 基本的列信息解析
            parts = line.split()
            if len(parts) >= 2:
                column_name = parts[0].strip()
                data_type = parts[1].strip()
                
                # 检查是否为NOT NULL
                is_nullable = 'NOT NULL' not in line.upper()
                
                columns.append({
                    'name': column_name,
                    'type': data_type,
                    'nullable': is_nullable,
                    'definition': line
                })
        
        return columns
    
    def _categorize_tables(self, tables: Dict) -> Dict:
        """按功能模块分类表"""
        categories = {
            'user_management': [],      # 用户管理
            'content_management': [],   # 内容管理
            'system_admin': [],         # 系统管理
            'business_core': [],        # 核心业务
            'financial': [],            # 财务相关
            'inventory': [],            # 库存管理
            'sales': [],               # 销售管理
            'purchase': [],            # 采购管理
            'reports': [],             # 报表相关
            'logs': [],                # 日志相关
            'others': []               # 其他
        }
        
        for table_name, table_info in tables.items():
            category = self._determine_category(table_name.lower())
            categories[category].append(table_name)
        
        return categories
    
    def _determine_category(self, table_name: str) -> str:
        """确定表的分类"""
        # 用户管理相关
        if any(keyword in table_name for keyword in ['user', 'account', 'role', 'permission', 'group']):
            return 'user_management'
        
        # 内容管理相关
        elif any(keyword in table_name for keyword in ['blog', 'journal', 'content', 'article', 'image', 'document', 'dl', 'wiki']):
            return 'content_management'
        
        # 系统管理相关
        elif any(keyword in table_name for keyword in ['ad_', 'system', 'config', 'counter', 'release']):
            return 'system_admin'
        
        # 财务相关
        elif any(keyword in table_name for keyword in ['fa_', 'finance', 'account', 'cost', 'price']):
            return 'financial'
        
        # 库存管理相关
        elif any(keyword in table_name for keyword in ['m_inventory', 'm_storage', 'm_product', 'storage', 'inventory']):
            return 'inventory'
        
        # 销售管理相关
        elif any(keyword in table_name for keyword in ['m_sale', 'm_retail', 'sale', 'retail']):
            return 'sales'
        
        # 采购管理相关
        elif any(keyword in table_name for keyword in ['m_purchase', 'purchase', 'supplier']):
            return 'purchase'
        
        # 日志相关
        elif any(keyword in table_name for keyword in ['log', '_log', 'tracker']):
            return 'logs'
        
        # 报表相关
        elif any(keyword in table_name for keyword in ['report', 'stats', 'summary']):
            return 'reports'
        
        # 核心业务相关
        elif any(keyword in table_name for keyword in ['b_', 'c_', 'm_', 'p_']):
            return 'business_core'
        
        # 其他
        else:
            return 'others'


def create_directory_structure():
    """创建目录结构"""
    base_dir = Path('database_structure')
    
    directories = [
        'schemas',
        'tables_by_module',
        'field_references',
        'analysis_reports',
        'sql_templates'
    ]
    
    for directory in directories:
        (base_dir / directory).mkdir(parents=True, exist_ok=True)
    
    return base_dir


def analyze_databases():
    """分析数据库结构"""
    analyzer = DDLAnalyzer()
    base_dir = create_directory_structure()
    
    # DDL文件列表
    ddl_files = ['bosnds3.ddl', 'boslportal4.ddl']
    
    all_analysis = {}
    
    for ddl_file in ddl_files:
        if os.path.exists(ddl_file):
            print(f"\n开始分析 {ddl_file}...")
            analysis = analyzer.parse_ddl_file(ddl_file)
            all_analysis[analysis['database']] = analysis
            
            # 保存数据库架构概览
            with open(base_dir / 'schemas' / f"{analysis['database']}_schema.json", 'w', encoding='utf-8') as f:
                json.dump(analysis, f, ensure_ascii=False, indent=2)
            
            # 按模块保存表结构
            save_tables_by_module(analysis, base_dir)
            
            print(f"✓ {analysis['database']} 分析完成，共发现 {analysis['total_tables']} 个表")
        else:
            print(f"⚠ 文件不存在: {ddl_file}")
    
    # 生成总体分析报告
    generate_analysis_report(all_analysis, base_dir)
    
    return all_analysis


def save_tables_by_module(analysis: Dict, base_dir: Path):
    """按模块保存表结构"""
    db_name = analysis['database']
    tables = analysis['tables']
    categories = analysis['categories']
    
    module_dir = base_dir / 'tables_by_module' / db_name
    module_dir.mkdir(parents=True, exist_ok=True)
    
    for category, table_list in categories.items():
        if table_list:  # 只保存非空模块
            module_tables = {
                'module': category,
                'table_count': len(table_list),
                'tables': {name: tables[name] for name in table_list if name in tables}
            }
            
            with open(module_dir / f"{category}.json", 'w', encoding='utf-8') as f:
                json.dump(module_tables, f, ensure_ascii=False, indent=2)


def generate_analysis_report(all_analysis: Dict, base_dir: Path):
    """生成分析报告"""
    report_file = base_dir / 'analysis_reports' / 'database_summary.md'
    
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("# 数据库结构分析报告\n\n")
        f.write(f"分析时间: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        for db_name, analysis in all_analysis.items():
            f.write(f"## {db_name} 数据库\n\n")
            f.write(f"- 总表数: {analysis['total_tables']}\n")
            
            f.write("\n### 按模块分类:\n\n")
            for category, tables in analysis['categories'].items():
                if tables:
                    f.write(f"- **{category}** ({len(tables)}个表): {', '.join(tables[:5])}")
                    if len(tables) > 5:
                        f.write(f" ... 等{len(tables)}个表")
                    f.write("\n")
            
            f.write("\n")


if __name__ == "__main__":
    print("🔍 数据库结构分析器启动...")
    analysis_result = analyze_databases()
    print("\n✅ 分析完成！请查看 database_structure 目录中的结果文件。") 
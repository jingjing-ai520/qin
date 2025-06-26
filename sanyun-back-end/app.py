from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config
from database import db_manager
from services.sales_service import SalesService
import cx_Oracle
import os

app = Flask(__name__)
app.config.from_object(Config)

# 启用CORS
CORS(app)

# 设置Oracle客户端路径
oracle_client_path = r"E:\oracle\instantclient_11_2"
if oracle_client_path not in os.environ.get('PATH', ''):
    os.environ['PATH'] = oracle_client_path + ';' + os.environ.get('PATH', '')

try:
    cx_Oracle.init_oracle_client(lib_dir=oracle_client_path)
except Exception as e:
    print(f"Oracle client already initialized or error: {e}")

# 数据库配置
DB_CONFIG = {
    'user': 'bosnds3',
    'password': 'abc123',
    'dsn': '49.235.20.50:8853/orcl'
}

# 创建销售服务实例
sales_service = SalesService(DB_CONFIG)

@app.route('/')
def hello():
    return jsonify({'message': '三云零售系统后端API', 'status': 'running'})

@app.route('/api/sales/overview')
def sales_overview():
    """销售概览接口"""
    try:
        # 获取查询参数
        selected_date = request.args.get('date')
        analysis_type = request.args.get('type', 'month')
        
        data = sales_service.get_sales_overview(selected_date, analysis_type)
        return jsonify({
            'success': True,
            'data': data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取销售概览失败: {str(e)}'
        }), 500

@app.route('/api/sales/stores')
def top_stores():
    """店铺排行接口"""
    try:
        limit = request.args.get('limit', 10, type=int)
        selected_date = request.args.get('date')
        analysis_type = request.args.get('type', 'month')
        
        data = sales_service.get_top_stores(limit, selected_date, analysis_type)
        return jsonify({
            'success': True,
            'data': data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取店铺排行失败: {str(e)}'
        }), 500

@app.route('/api/sales/metrics')
def sales_metrics():
    """销售指标接口"""
    try:
        # 获取查询参数
        selected_date = request.args.get('date')
        analysis_type = request.args.get('type', 'month')
        
        data = sales_service.get_sales_metrics(selected_date, analysis_type)
        return jsonify({
            'success': True,
            'data': data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取销售指标失败: {str(e)}'
        }), 500

@app.route('/api/test/db')
def test_db():
    """测试数据库连接"""
    try:
        connection = cx_Oracle.connect(**DB_CONFIG)
        cursor = connection.cursor()
        cursor.execute("SELECT COUNT(*) FROM m_retail WHERE billdate >= 20241201")
        count = cursor.fetchone()[0]
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'message': '数据库连接成功',
            'recent_records': count
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'数据库连接失败: {str(e)}'
        }), 500

@app.route('/api/sales/trend', methods=['GET'])
def get_sales_trend():
    """获取销售趋势数据"""
    try:
        # 获取查询参数
        selected_date = request.args.get('date')
        analysis_type = request.args.get('type', 'month')
        
        trend_data = sales_service.get_sales_trend(selected_date, analysis_type)
        return jsonify({
            'success': True,
            'data': trend_data
        })
    except Exception as e:
        print(f"获取销售趋势失败: {e}")
        return jsonify({
            'success': False,
            'message': f'获取销售趋势失败: {str(e)}'
        }), 500

@app.route('/api/members/analysis', methods=['GET'])
def get_member_analysis():
    """获取会员分析数据"""
    try:
        # 获取查询参数
        selected_date = request.args.get('date')
        analysis_type = request.args.get('type', 'month')
        
        member_data = sales_service.get_member_analysis(selected_date, analysis_type)
        return jsonify({
            'success': True,
            'data': member_data
        })
    except Exception as e:
        print(f"获取会员分析失败: {e}")
        return jsonify({
            'success': False,
            'message': f'获取会员分析失败: {str(e)}'
        }), 500

@app.route('/api/sales/detailed-metrics', methods=['GET'])
def get_detailed_metrics():
    """获取详细销售指标"""
    try:
        date = request.args.get('date')
        period = request.args.get('period', 'month')
        
        detailed_metrics = sales_service.get_detailed_metrics(date, period)
        return jsonify({
            'success': True,
            'data': detailed_metrics
        })
    except Exception as e:
        print(f"获取详细指标失败: {e}")
        return jsonify({
            'success': False,
            'message': f'获取详细指标失败: {str(e)}'
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 
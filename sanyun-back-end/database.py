import cx_Oracle
from typing import Optional, List, Dict, Any
from config import Config

class DatabaseManager:
    """数据库管理类"""
    
    def __init__(self):
        self.config = Config()
        self._connection = None
    
    def get_connection(self) -> Optional[cx_Oracle.Connection]:
        """获取数据库连接"""
        try:
            if self._connection is None or not self._connection.ping():
                dsn = cx_Oracle.makedsn(
                    self.config.DB_HOSTNAME,
                    self.config.DB_PORT,
                    service_name=self.config.DB_SERVICE_NAME
                )
                self._connection = cx_Oracle.connect(
                    self.config.DB_USERNAME,
                    self.config.DB_PASSWORD,
                    dsn,
                    encoding="UTF-8"
                )
            return self._connection
        except Exception as e:
            print(f"数据库连接失败: {e}")
            return None
    
    def execute_query(self, query: str, params: Dict[str, Any] = None) -> List[tuple]:
        """执行查询并返回结果"""
        connection = self.get_connection()
        if not connection:
            raise Exception("无法连接到数据库")
        
        try:
            cursor = connection.cursor()
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            results = cursor.fetchall()
            cursor.close()
            return results
        except Exception as e:
            raise Exception(f"查询执行失败: {str(e)}")
    
    def execute_single_query(self, query: str, params: Dict[str, Any] = None) -> Optional[tuple]:
        """执行查询并返回单个结果"""
        connection = self.get_connection()
        if not connection:
            raise Exception("无法连接到数据库")
        
        try:
            cursor = connection.cursor()
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            result = cursor.fetchone()
            cursor.close()
            return result
        except Exception as e:
            raise Exception(f"查询执行失败: {str(e)}")
    
    def close_connection(self):
        """关闭数据库连接"""
        if self._connection:
            self._connection.close()
            self._connection = None

# 全局数据库管理器实例
db_manager = DatabaseManager() 
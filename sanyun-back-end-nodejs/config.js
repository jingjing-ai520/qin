require('dotenv').config();

class Config {
    /**
     * 应用配置类
     */
    
    // 数据库配置
    static DB_USERNAME = process.env.DB_USERNAME || 'bosnds3';
    static DB_PASSWORD = process.env.DB_PASSWORD || 'abc123';
    static DB_HOSTNAME = process.env.DB_HOSTNAME || '49.235.20.50';
    static DB_PORT = parseInt(process.env.DB_PORT || '8853');
    static DB_SERVICE_NAME = process.env.DB_SERVICE_NAME || 'orcl';
    
    // Express配置
    static DEBUG = (process.env.NODE_ENV || 'development') !== 'production';
    static SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key-here';
    
    // CORS配置
    static CORS_ORIGINS = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*'];
    
    // API配置
    static API_PREFIX = '/api';
    static API_VERSION = 'v1';
    
    // 获取数据库连接字符串
    static getDatabaseUrl() {
        return `${this.DB_HOSTNAME}:${this.DB_PORT}/${this.DB_SERVICE_NAME}`;
    }
    
    // 获取数据库配置对象
    static getDatabaseConfig() {
        return {
            user: this.DB_USERNAME,
            password: this.DB_PASSWORD,
            connectString: this.getDatabaseUrl()
        };
    }
}

module.exports = Config; 
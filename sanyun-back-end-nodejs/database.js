const oracledb = require('oracledb');
const Config = require('./config');

// 配置Oracle兼容性设置
oracledb.outFormat = oracledb.OUT_FORMAT_ARRAY;
oracledb.fetchArraySize = 100;

class DatabaseManager {
    /**
     * 数据库管理类
     */
    
    constructor() {
        this.config = Config;
        this._connection = null;
        
        // 配置Oracle连接池 - 添加兼容性选项
        this.poolConfig = {
            user: this.config.DB_USERNAME,
            password: this.config.DB_PASSWORD,
            connectString: this.config.getDatabaseUrl(),
            poolMin: 1,
            poolMax: 10,
            poolIncrement: 1,
            poolTimeout: 120,
            stmtCacheSize: 23,
            connectTimeout: 60
        };
    }
    
    /**
     * 获取数据库连接
     * @returns {Promise<oracledb.Connection|null>}
     */
    async getConnection() {
        try {
            if (!this._connection || this._connection.isClosed) {
                this._connection = await oracledb.getConnection(this.poolConfig);
            }
            return this._connection;
        } catch (error) {
            console.error(`数据库连接失败: ${error.message}`);
            return null;
        }
    }
    
    /**
     * 执行查询并返回结果
     * @param {string} query - SQL查询语句
     * @param {Object} params - 查询参数
     * @returns {Promise<Array>}
     */
    async executeQuery(query, params = {}) {
        const connection = await this.getConnection();
        if (!connection) {
            throw new Error("无法连接到数据库");
        }
        
        try {
            const result = await connection.execute(query, params, {
                outFormat: oracledb.OUT_FORMAT_ARRAY
            });
            return result.rows;
        } catch (error) {
            throw new Error(`查询执行失败: ${error.message}`);
        }
    }
    
    /**
     * 执行查询并返回单个结果
     * @param {string} query - SQL查询语句
     * @param {Object} params - 查询参数
     * @returns {Promise<Array|null>}
     */
    async executeSingleQuery(query, params = {}) {
        const connection = await this.getConnection();
        if (!connection) {
            throw new Error("无法连接到数据库");
        }
        
        try {
            const result = await connection.execute(query, params, {
                outFormat: oracledb.OUT_FORMAT_ARRAY
            });
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (error) {
            throw new Error(`查询执行失败: ${error.message}`);
        }
    }
    
    /**
     * 关闭数据库连接
     */
    async closeConnection() {
        if (this._connection && !this._connection.isClosed) {
            try {
                await this._connection.close();
                this._connection = null;
            } catch (error) {
                console.error(`关闭连接失败: ${error.message}`);
            }
        }
    }
    
    /**
     * 初始化连接池
     */
    static async initializePool() {
        try {
            await oracledb.createPool({
                user: Config.DB_USERNAME,
                password: Config.DB_PASSWORD,
                connectString: Config.getDatabaseUrl(),
                poolMin: 1,
                poolMax: 10,
                poolIncrement: 1
            });
            console.log('Oracle连接池初始化成功');
        } catch (error) {
            console.error(`连接池初始化失败: ${error.message}`);
        }
    }
    
    /**
     * 关闭连接池
     */
    static async closePool() {
        try {
            await oracledb.getPool().close(0);
            console.log('Oracle连接池已关闭');
        } catch (error) {
            console.error(`关闭连接池失败: ${error.message}`);
        }
    }
}

// 全局数据库管理器实例
const dbManager = new DatabaseManager();

module.exports = { DatabaseManager, dbManager }; 
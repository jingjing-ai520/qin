<template>
    <el-aside class="aside" width="width">
        
        <el-menu :collapse = "isCollapse" router="true">
            <el-menu-item 
            v-for="item in NoChildren"
            :key="item.path"
            :index="item.path"
            >
                <component class ="icons" :is="item.icon"></component>
                <span>{{ item.label }}</span>
            </el-menu-item>
            <el-sub-menu 
            v-for="item in HasChildren"
            :key="item.path"
            :index="item.path"
            >
                <template #title>
                    <component class ="icons" :is="item.icon"></component>
                    <span>{{ item.label }}</span>
                </template>
                <el-menu-item-group>
                    <el-menu-item
                        v-for="(childitem,index) in item.children"
                        :key="childitem.path"
                        :index="childitem.path"
                    >
                    <component class ="icons" :is="childitem.icon"></component>
                    <span>{{ childitem.label }}</span>
                    </el-menu-item>
                </el-menu-item-group>
            </el-sub-menu>
        </el-menu>
    </el-aside>
</template>

<script setup>
import { ref,computed } from 'vue'
import { useAllDataStore } from '@/stores'
const aisde_menu = ref([
    {
        "path": "/",
        "label": "首页",
        "icon": "House",
        "name": "Home",
        "url": "/"
    },
    {
      "path": "/user",
      "label": "用户管理",
      "icon": "User",
      "name": "UserManagement",
      "url": "/user"
    },
    {
      "path": "/customer",
      "label": "客户管理",
      "icon": "Avatar",
      "name": "CustomerManagement",
      "url": "/customer",
      "children": [
        {
          "path": "/customer/list",
          "label": "客户列表",
          "icon": "list",
          "name": "CustomerList",
          "url": "/customer/list"
        },
        {
          "path": "/customer/classification",
          "label": "客户分类",
          "icon": "CollectionTag",
          "name": "CustomerClassification",
          "url": "/customer/classification"
        },
        {
          "path": "/customer/follow-up",
          "label": "客户跟进",
          "icon": "UserFilled",
          "name": "CustomerFollowUp",
          "url": "/customer/follow-up"
        },
        {
          "path": "/customer/portrait",
          "label": "客户画像",
          "icon": "DataAnalysis",
          "name": "CustomerPortrait",
          "url": "/customer/portrait"
        }
      ]
    },
    {
      "path": "/product",
      "label": "商品管理",
      "icon": "goods",
      "name": "ProductManagement",
      "url": "/product",
      "children": [
        {
          "path": "/product/inventory",
          "label": "库存管理",
          "icon": "house",
          "name": "InventoryManagement",
          "url": "/product/inventory"
        },
        {
          "path": "/product/category",
          "label": "商品分类",
          "icon": "grid",
          "name": "ProductCategory",
          "url": "/product/category"
        },
        {
          "path": "/product/statistics",
          "label": "商品统计",
          "icon": "Histogram",
          "name": "ProductStatistics",
          "url": "/product/statistics"
        }
      ]
    },
    {
      "path": "/sales-report",
      "label": "销售报表",
      "icon": "document",
      "name": "SalesReport",
      "url": "/sales-report",
      "children": [
        {
          "path": "/sales-report/daily",
          "label": "日报表",
          "icon": "document",
          "name": "DailyReport",
          "url": "/sales-report/daily"
        },
        {
          "path": "/sales-report/monthly",
          "label": "月报表",
          "icon": "document",
          "name": "MonthlyReport",
          "url": "/sales-report/monthly"
        },
        {
          "path": "/sales-report/yearly",
          "label": "年报表",
          "icon": "document",
          "name": "YearlyReport",
          "url": "/sales-report/yearly"
        },
        {
          "path": "/sales-report/custom",
          "label": "自定义报表",
          "icon": "reading",
          "name": "CustomReport",
          "url": "/sales-report/custom"
        },
        {
          "path": "/sales-report/export",
          "label": "报表导出",
          "icon": "printer",
          "name": "ReportExport",
          "url": "/sales-report/export"
        }
      ]
    },
    {
      "path": "/wechat",
      "label": "微信集成",
      "icon": "ChatRound",
      "name": "WeChatIntegration",
      "url": "/wechat",
      "children": [
        {
          "path": "/wechat/binding",
          "label": "企业微信绑定",
          "icon": "link",
          "name": "WeComBinding",
          "url": "/wechat/binding"
        },
        {
          "path": "/wechat/message",
          "label": "消息推送",
          "icon": "ChatLineSquare",
          "name": "MessagePush",
          "url": "/wechat/message"
        },
        {
          "path": "/wechat/miniprogram",
          "label": "小程序开发",
          "icon": "Setting",
          "name": "MiniProgram",
          "url": "/wechat/miniprogram"
        },
        {
          "path": "/wechat/scan",
          "label": "扫码功能",
          "icon": "FullScreen",
          "name": "ScanFunction",
          "url": "/wechat/scan"
        },
        {
          "path": "/wechat/payment",
          "label": "微信支付",
          "icon": "Wallet",
          "name": "WeChatPayment",
          "url": "/wechat/payment"
        }
      ]
    },
    {
      "path": "/data-analysis",
      "label": "数据分析",
      "icon": "TrendCharts",
      "name": "DataAnalysis",
      "url": "/data-analysis",
      "children": [
        {
          "path": "/data-analysis/sales-trend",
          "label": "销售趋势",
          "icon": "TrendCharts",
          "name": "SalesTrend",
          "url": "/data-analysis/sales-trend"
        },
        {
          "path": "/data-analysis/customer-analysis",
          "label": "客户分析",
          "icon": "stamp",
          "name": "CustomerAnalysis",
          "url": "/data-analysis/customer-analysis"
        },
        {
          "path": "/data-analysis/product-analysis",
          "label": "商品分析",
          "icon": "Coin",
          "name": "ProductAnalysis",
          "url": "/data-analysis/product-analysis"
        },
        {
          "path": "/data-analysis/prediction",
          "label": "预测分析",
          "icon": "PieChart",
          "name": "PredictionAnalysis",
          "url": "/data-analysis/prediction"
        },
        {
          "path": "/data-analysis/dashboard",
          "label": "仪表盘",
          "icon": "Tools",
          "name": "Dashboard",
          "url": "/data-analysis/dashboard"
        }
      ]
    }
])


const NoChildren = computed(()=>aisde_menu.value.filter(item => !item.children))
const HasChildren = computed(()=>aisde_menu.value.filter(item => item.children))

const store = useAllDataStore()
const isCollapse = computed(()=>store.state.isCollapse)

const width = computed(()=>store.state.isCollapse ? '60px' : '200px')

</script>

<style lang="less" scoped>
.icons{
    width: 18px;
    height: 18px;
    margin-right: 5px;
}
.aside{
    height: 100%;
    background-color: #ffffff !important;
}
.el-menu{
    border-right: none;
}
</style>
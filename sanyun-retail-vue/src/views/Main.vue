<script setup>
import CommenAside from "@/components/CommenAside.vue";
import CommenHeader from "@/components/CommenHeader.vue";
</script>

<template>
    <div class="commen-layout">
        <el-container class="lay-container">
            <el-header class="el-header">
                <commen-header/>
            </el-header>
            
            <el-container>
                <commen-aside/>
                <el-main class="commen-main">
                    <router-view/>
                </el-main>
            </el-container>

        </el-container>
    </div>
</template>

<style scoped lang="less">
    .commen-layout{
        height: 100vh;
    }
    .lay-container {
        height: 100vh;
        }
    .el-header {
        background-color: #333;
    }
</style>

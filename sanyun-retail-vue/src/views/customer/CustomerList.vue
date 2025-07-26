<template>
  <div class="customer-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>客户列表</span>
          <el-button type="primary" size="small" @click="showAddDialog">新增客户</el-button>
        </div>
      </template>
      
      <el-table 
        :data="tableData.slice((currentPage - 1) * pageSize, currentPage * pageSize)" 
        border 
        style="width: 100%"
        :header-cell-style="{background:'#f5f7fa',color:'#606266'}"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="cloudCardNo" label="三云会员卡号" min-width="180" />
        <el-table-column prop="offlineCardNo" label="线下会员卡号" min-width="180" />
        <el-table-column prop="phone" label="手机号" min-width="120" />
        <el-table-column prop="store" label="注册门店" min-width="180" />
        <el-table-column prop="registerTime" label="注册时间" min-width="180" />
        <el-table-column prop="channel" label="注册渠道" min-width="120" />
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="{row}">
            <el-tag :type="row.status === '活跃' ? 'success' : 'info'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{row}">
            <el-button 
              size="small" 
              type="danger"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>


      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :small="false"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>


    <el-dialog v-model="dialogVisible" title="新增客户" width="30%">
      <el-form :model="newCustomer" label-width="80px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="newCustomer.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="newCustomer.phone" placeholder="请输入11位手机号" maxlength="11" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAdd">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {getCustomer, addCustomer, deleteCustomer} from '@/api/customer'
import { ElMessage, ElMessageBox } from 'element-plus'
import { v4 as uuidv4 } from 'uuid'

const apiUrl = 'http://127.0.0.1:4523/m1/6738857-6450166-default/api/customer/query'
const add_api = 'http://127.0.0.1:4523/m1/6738857-6450166-default/api/customer/add'
const delete_api = 'http://127.0.0.1:4523/m1/6738857-6450166-default/api/customer/delete'
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const tableData = ref([])

const search = async () => {
  const response = await getCustomer();
  if (response.code) {
    tableData.value = response.data
    total.value = response.data.length
  }
}

// 删除客户函数
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该客户吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
      // const response = await axios.delete(delete_api, {
      //   data: {
      //     cloudCardNo: row.cloudCardNo  
      //   }
      // })
      // if (response.data.code) {
      // ElMessage.success('删除成功')
      // await search()
      // }
      const response = await deleteCustomer(row.cloudCardNo);
      if (response.code) {
        ElMessage.success('删除成功')
        await search()
      }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleSizeChange = (val) => {
  pageSize.value = val
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

onMounted(search)



const dialogVisible = ref(false)
const newCustomer = ref({
  name: '',
  phone: ''
})

const showAddDialog = () => {
  dialogVisible.value = true
}

const handleAdd = async () => {
  if (!newCustomer.value.name || !newCustomer.value.phone) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  if (!/^1[3-9]\d{9}$/.test(newCustomer.value.phone)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }

  try {
    const customerData = {
      cloudCardNo: uuidv4(),
      offlineCardNo: `OFF${Date.now()}`,
      phone: newCustomer.value.phone,
      registerTime: new Date().toISOString(),
      status: '活跃',
      name: newCustomer.value.name
    }

    // const response = await axios.post(add_api, customerData)
    // if (response.data.code) {
    //   ElMessage.success('新增成功')
    //   dialogVisible.value = false
    //   // 重置输入框内容
    //   newCustomer.value = {
    //     name: '',
    //     phone: ''
    //   }
    //   await search()
    // }
    const response = await addCustomer(customerData);
    if (response.code) {
      ElMessage.success('新增成功')
      dialogVisible.value = false
      // 重置输入框内容
      newCustomer.value = {
        name: '',
        phone: ''
      }
      await search()
    }
    
  } catch (error) {
    ElMessage.error('新增失败')
    console.error(error)
  }
}
</script>




<style scoped lang="less">
.customer-list-container {
  padding: 20px;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
  
}
</style>
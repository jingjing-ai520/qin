import {defineStore} from 'pinia'
import {ref} from 'vue'

/*引入pinia，用来存放数据，使数据可以在不同的文件中共享*/ 
function initState(){
    return {
        isCollapse: false,
    }
}
export const useAllDataStore = defineStore('Alldata', () => {
    
  
    const state = ref(initState())
    return {
        state
    }
  })
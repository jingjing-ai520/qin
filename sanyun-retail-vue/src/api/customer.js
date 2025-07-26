import request from "@/utils/request";

export const getCustomer = () => request.get('/api/customer/query');

export const addCustomer = (data) => request.post('/api/customer/add', data);

export const deleteCustomer = (cloudCardNo) => 
  request.delete('/api/customer/delete', { data: { cloudCardNo } });
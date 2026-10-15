import axios from 'axios';
const base = '/api/v1/accounting';
export const accounting = {
  vehicleExpense: (id, body) => axios.post(`${base}/vehicles/${id}/expenses`, body),
  reverseVehicleExpense: (id, expenseId, reason) => axios.post(`${base}/vehicles/${id}/expenses/${expenseId}/reverse`, { reason }),
  masters: () => axios.get(`${base}/masters`),
  dashboard: params => axios.get(`${base}/dashboard`, { params }),
  loads: params => axios.get(`${base}/loads`, { params }),
  load: id => axios.get(`${base}/loads/${id}`),
  terms: (id, body) => axios.put(`${base}/loads/${id}/terms`, body),
  pod: (id, body) => axios.put(`${base}/loads/${id}/pod`, body),
  post: (id, body) => axios.post(`${base}/loads/${id}/transactions`, body),
  reverse: (id, resource, transactionId, reason) => axios.post(`${base}/loads/${id}/reverse/${resource}/${transactionId}`, { reason }),
  status: (id, status) => axios.patch(`${base}/loads/${id}/status`, { status }),
  cancel: (id, reason) => axios.post(`${base}/loads/${id}/cancel`, { reason }),
  classify: (id, classification) => axios.put(`${base}/vehicles/${id}/classification`, { classification }),
  report: (name, params) => axios.get(`${base}/reports/${name}`, { params }),
  export: (name, params) => axios.get(`${base}/reports/${name}`, { params: { ...params, format: 'csv' }, responseType: 'blob' })
};

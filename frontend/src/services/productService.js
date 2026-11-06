import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api', headers: { 'Content-Type': 'application/json' } });

export const productService = {
  async list({ search = '', status = '' } = {}) {
    const { data } = await api.get('/products', { params: { ...(search ? { search } : {}), ...(status ? { status } : {}) } });
    return data.data;
  },
  async summary() { const { data } = await api.get('/products/summary'); return data.data; },
  async create(product) { const { data } = await api.post('/products', product); return data.data; },
  async update(id, product) { const { data } = await api.put(`/products/${id}`, product); return data.data; },
  async remove(id) { return (await api.delete(`/products/${id}`)).data; }
};

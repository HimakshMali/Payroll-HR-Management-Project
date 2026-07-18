import axios from 'axios';

const baseURL = import.meta.env.VITE_BACKEND_BASE_API;
const axiosInstance = axios.create({
    baseURL : baseURL,
    headers : {
        'Content-Type':"application/json"
    }
});


//  request interceptor
axiosInstance.interceptors.request.use(
    function(config) {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {

            config.headers['Authorization'] = `Bearer ${accessToken}`;
            
        }
        return config;
    },
    function(error) {
        return Promise.reject(error);
    }
);


//  response Intercepor
// Response Interceptor
axiosInstance.interceptors.response.use(
    function(response){
        return response;
    },
    async function(error){
        const originalRequest = error.config;

        // Check for expired access keys without loop traps
        if(error.response && error.response.status === 401 && !originalRequest.retry){
            originalRequest.retry = true;
            const refreshToken = localStorage.getItem('refreshToken');
            try {
                // Fixed path to include '/auth/' to match Django urls.py configurations
                const response = await axios.post(`${baseURL}auth/token/refresh/`, { refresh: refreshToken });
                localStorage.setItem('accessToken', response.data.access);
                
                // Retry initial network execution loop
                originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
import { toast } from 'react-hot-toast';
import api from '../services/api';

// Call this from anywhere (requires navigate from useNavigate hook)
export const logout = (navigate) => { 
   localStorage.removeItem("access_token"); 
   localStorage.removeItem("refresh_token"); 
 
   delete api.defaults.headers.common["Authorization"]; 
 
   toast.success('Logged out successfully 👋'); 
 
   navigate('/login'); 
 };

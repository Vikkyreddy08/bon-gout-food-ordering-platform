// Call this from anywhere
export const logout = () => {
  localStorage.clear();  // Clear everything
  toast.success('Logged out successfully 👋');
  window.location.href = '/login';
};

document.getElementById('addUserBtn').addEventListener('click', () => {
  document.getElementById('userModal').style.display = 'flex';
});
document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('userModal').style.display = 'none';
});
document.getElementById('cancelBtn').addEventListener('click', () => {
  document.getElementById('userModal').style.display = 'none';
});



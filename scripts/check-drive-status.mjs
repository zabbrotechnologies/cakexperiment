async function checkDriveStatus() {
  const res = await fetch('https://thecakexperiment.com/api/admin/storage/google-drive/status');
  console.log('Status code:', res.status);
  const text = await res.text();
  console.log('Response:', text);
}
checkDriveStatus();

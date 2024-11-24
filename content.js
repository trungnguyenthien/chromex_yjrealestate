// Chèn file inject.js vào ngữ cảnh trang web
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.onload = function () {
  this.remove(); // Xóa script sau khi thực thi
};
document.documentElement.appendChild(script);

// Lắng nghe sự kiện crumbsData từ inject.js
window.addEventListener('crumbsData', async (event) => {
  const crumbs = event.detail.crumbs;
  if (!crumbs) {
    console.error('Crumbs không tồn tại!');
    return;
  }

  const url = `https://realestate.yahoo.co.jp/api/v2/personal/favorite/conditions?bk=&crumb=${crumbs}&infoDiv=app`;

  try {
    // Thực hiện phương thức GET
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Lỗi khi thực hiện GET request:', response.status, response.statusText);
      return;
    }

    // Chuyển đổi response thành JSON và console.log kết quả
    const data = await response.json();
    console.log('Kết quả trả về:', data);
  } catch (error) {
    console.error('Đã xảy ra lỗi:', error);
  }
});

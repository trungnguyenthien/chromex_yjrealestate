// Chèn file inject.js vào ngữ cảnh trang web
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.onload = function () {
  this.remove(); // Xóa script sau khi thực thi
};
document.documentElement.appendChild(script);

window.addEventListener('crumbsData', (event) => {
  const crumbs = event.detail.crumbs;
  if (!crumbs) {
    console.error('Crumbs không tồn tại!');
    return;
  }
  const url = `https://realestate.yahoo.co.jp/api/v2/personal/favorite/conditions?bk=&crumb=${crumbs}&infoDiv=app`;

  // Sử dụng jQuery để thực hiện GET request
  $.ajax({
    url: url,
    method: 'GET',
    dataType: 'json', // Chỉ định kiểu dữ liệu trả về
    success: function (data) {
      console.log('Kết quả trả về:', data);
    },
    error: function (xhr, status, error) {
      console.error('Lỗi khi thực hiện GET request:', status, error);
    }
  });
});

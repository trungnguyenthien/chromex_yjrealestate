// Chèn file inject.js vào ngữ cảnh trang web
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.onload = function () {
  // Xóa script khỏi DOM sau khi đã thực thi để tránh ô nhiễm DOM
  this.remove();
};
document.documentElement.appendChild(script);

// Lắng nghe sự kiện 'crumbsData' được gửi từ inject.js
window.addEventListener('crumbsData', (event) => {
  const crumbs = event.detail.crumbs;
  
  // Kiểm tra nếu crumbs không tồn tại
  if (!crumbs) {
    console.error('Crumbs không tồn tại!');
    return;
  }

  // URL API được xây dựng dựa trên crumbs
  const url = `https://realestate.yahoo.co.jp/api/v2/personal/favorite/conditions?bk=&crumb=${crumbs}&infoDiv=app`;

  // Gửi yêu cầu GET tới API bằng jQuery AJAX
  $.ajax({
    url: url,
    method: 'GET',
    dataType: 'json', // Định dạng dữ liệu trả về là JSON
    success: function (data) {
      console.log('Kết quả trả về:', data);

      // Lấy danh sách conditions từ phản hồi của API
      const conditions = data.ResultSet.conditions;
      console.log(conditions);

      // Duyệt qua từng condition
      for (const cond of conditions) {
        let id = cond.id; // ID của condition
        let apiParams = cond.apiParams; // Các tham số của API liên quan đến condition

        // Làm sạch apiParams bằng cách loại bỏ các giá trị không hợp lệ
        apiParams = cleanObject(apiParams);

        let label = cond.label; // Label của condition
        let alerts = cond.alerts; // Alerts liên quan đến condition

        // In thông tin condition ra console
        console.log(`condition id = ${id}`);
        console.log(`apiParams===`);
        console.log(apiParams);
      }
    },
    error: function (xhr, status, error) {
      // Ghi log lỗi nếu yêu cầu API thất bại
      console.error('Lỗi khi thực hiện GET request:', status, error);
    }
  });
});

/**
 * Hàm tìm node cha chứa thẻ <a> với class và thuộc tính yêu cầu
 * @param {string} conditionId - ID của condition
 * @returns {jQuery|null} - Node cha chứa thẻ <a>, hoặc null nếu không tìm thấy
 */
function findDivOfCondition(conditionId) {
  // Tìm thẻ <a> với class là "BoxInquiry__title__deleteBtn" và thuộc tính "data-cd_id" phù hợp
  const $targetAnchor = $(`a.BoxInquiry__title__deleteBtn[data-cd_id="${conditionId}"]`);
  
  // Nếu không tìm thấy thẻ <a>, log lỗi và trả về null
  if ($targetAnchor.length === 0) {
    console.error(`Không tìm thấy thẻ <a> với data-cd_id="${conditionId}"`);
    return null;
  }
  
  // Trả về node cha chứa thẻ <a>
  return $targetAnchor.parent();
}

/**
 * Hàm làm sạch đối tượng bằng cách loại bỏ các key-value có giá trị null, undefined, hoặc chuỗi rỗng
 * @param {Object} obj - Đối tượng cần làm sạch
 * @returns {Object} - Đối tượng đã loại bỏ các giá trị không hợp lệ
 */
function cleanObject(obj) {
  // Chuyển object thành mảng các cặp key-value, lọc bỏ các giá trị không hợp lệ, rồi chuyển về object
  return Object.fromEntries(
    Object.entries(obj).filter(([key, value]) => value != null && value !== '')
  );
}

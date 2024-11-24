// Chèn file inject.js vào ngữ cảnh trang web
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.onload = function () {
  // Xóa script khỏi DOM sau khi đã thực thi để tránh ô nhiễm DOM
  this.remove();
};
document.documentElement.appendChild(script);
const textColor = "#1b1e6c"
// Lắng nghe sự kiện 'crumbsData' được gửi từ inject.js
window.addEventListener('crumbsData', (event) => {
  const crumbs = event.detail.crumbs;

  sleep(1000).then(() => {

    // Kiểm tra nếu crumbs không tồn tại
    if (!crumbs) {
      console.error('Crumbs không tồn tại!');
      return;
    }

    // URL API được xây dựng dựa trên crumbs
    const url = `https://realestate.yahoo.co.jp/api/v2/personal/favorite/conditions?bk=&crumb=${crumbs}&infoDiv=app`;
    let topDiv = findListInfoMail()
    addButtonToTopDiv(topDiv, url);    // Thêm button vào topDiv

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
          let apiParams = cond.apiParams; // Các tham số của API liên quan đến condition
          // Làm sạch apiParams bằng cách loại bỏ các giá trị không hợp lệ
          apiParams = cleanObject(apiParams);

          // Chuyển apiParams thành Map để dễ truy cập và sử dụng
          let mapApiParams = new Map();
          Object.entries(apiParams).forEach(([key, value]) => {
            mapApiParams.set(key, value);
          });

          // Xử lý labels: chuyển thành Map, hỗ trợ các labels lồng nhau
          let mapLabels = new Map();
          if (cond.label) {
            Object.entries(cond.label).forEach(([key, value]) => {
              if (typeof value === 'string' || value instanceof String) {
                mapLabels.set(key, value);
              } else {
                Object.entries(value).forEach(([key2, value2]) => {
                  mapLabels.set(`${key}.${key2}`, value2);
                });
              }
            });
          }

          // Xử lý alerts: chuyển thành Map
          let mapAlertValues = new Map();
          if (cond.alerts) {
            Object.entries(cond.alerts).forEach(([key, value]) => {
              mapAlertValues.set(key, value);
            });
          }

          // Tạo đối tượng tóm tắt condition
          let summaryObject = {
            id: cond.id,
            url: cond.url,
            saveName: cond.saveName,
            date: cond.date,
            apiParams: mapApiParams,
            labels: mapLabels,
            alertValues: mapAlertValues
          };

          console.log(summaryObject);
          let parentDiv = findDivOfCondition(cond.id);
          if (parentDiv) {
            // Append các element vào parentDiv
            // Tạo bảng
            let table = $('<table border="1" style="width: 100%; margin-top: 10px; border-collapse: collapse; font-size: 10px;">');

            // Tạo header cho bảng
            table.append(`
              <thead style="background-color: ${textColor}; color: white; font-size: 1.1em;">
                  <tr>
                    <th style="padding: 10px; text-align: left; vertical-align: top;">ApiParams</th>
                    <th style="padding: 10px; text-align: left; vertical-align: top;">Label</th>
                    <th style="padding: 10px; text-align: left; vertical-align: top;">Alert</th>
                  </tr>
              </thead>
              <tbody style="line-height: 1.1;">
                <tr>
                  <td style="padding: 10px; text-align: left; vertical-align: top; color: ${textColor}">${listOf(summaryObject.apiParams)}</td>
                  <td style="padding: 10px; text-align: left; vertical-align: top; color: ${textColor}">${listOf(summaryObject.labels)}</td>
                  <td style="padding: 10px; text-align: left; vertical-align: top; color: ${textColor}">${listOf(summaryObject.alertValues)}</td>
                </tr>
              </tbody>
          `);
            // Append bảng vào parentDiv
            parentDiv.append(table);

            // Thêm các thông tin cơ bản vào parentDiv
            parentDiv.append(`<br/>`);
            parentDiv.append(`<div><b>⚡️ id</b>: <code>${summaryObject.id}</code></div>`);
            parentDiv.append(`<div><b>⚡️ url</b>: <a href="${summaryObject.url}" target="_blank">${summaryObject.url}</a></div>`);

            // Phân tích URL bằng hàm extractQuery
            let urlInfos = extractQuery(summaryObject.url);

            // Tạo link text để hiển thị nội dung URL details
            const linkText = $(`
  <a href="#" style="color: #007BFF; text-decoration: underline; cursor: pointer; margin-top: 10px;">
    🔻 Parse URL Details
  </a>
`);

            // Nội dung URL details
            const urlDetails = $(`
  <div style="display: none; border: 1px solid #ddd; margin-top: 10px; padding: 10px; border-radius: 5px; background-color: #f9f9f9;">
    <div><b></b> <code>${urlInfos.baseUrl}</code></div>
    <ul>
      ${Array.from(urlInfos.params.entries())
                .map(([key, value]) => `<li> -- <b>${key}:</b> ${value}</li>`)
                .join('')}
    </ul>
  </div>
`);

            // Thêm link text và nội dung URL details vào parentDiv
            parentDiv.append(linkText);
            parentDiv.append(urlDetails);

            // Xử lý sự kiện click cho link text
            linkText.on('click', function (e) {
              e.preventDefault(); // Ngăn chặn hành động mặc định của link
              if (urlDetails.is(':visible')) {
                urlDetails.slideUp(); // Ẩn nội dung
                linkText.text('🔻 Parse URL Details');
              } else {
                urlDetails.slideDown(); // Hiển thị nội dung
                linkText.text('🔺 Hide URL Details');
              }
            });

          } else {
            console.error(`Không tìm thấy parentDiv cho condition id: ${cond.id}`);
          }
        }
      },
      error: function (xhr, status, error) {
        console.error('Lỗi khi thực hiện GET request:', status, error);
      }
    });
  });
});

function listOf(map) {
  let listItems = Array()
  map.forEach((value, key) => {
    listItems.push(`<li><b>${key}</b>: ${value}</li>`)
  })
  let out = `<ul>${listItems.join('')}</ul>`
  console.log(out)
  return out
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
  return $targetAnchor.parent().parent();
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

/**
 * Hàm tìm thẻ <div> có class="ListInfoMail" và id="_ListInfoMail"
 * @returns {jQuery|null} - Trả về thẻ <div> nếu tìm thấy, hoặc null nếu không tìm thấy
 */
function findListInfoMail() {
  // Sử dụng jQuery để tìm thẻ <div> với class và id cụ thể
  const $div = $('div.ListInfoMail#_ListInfoMail');

  // Kiểm tra nếu không tìm thấy, trả về null
  if ($div.length === 0) {
    console.error('Không tìm thấy thẻ <div> với class="ListInfoMail" và id="_ListInfoMail"');
    return null;
  }
  // Trả về thẻ <div> tìm được
  return $div;
}

/**
 * Thêm button vào `topDiv` và xử lý sự kiện click
 */
function addButtonToTopDiv(topDiv, url) {
  if (!topDiv || topDiv.length === 0) {
    console.error("Không tìm thấy `topDiv` để thêm button.");
    return;
  }

  // Tạo button
  const button = $('<button>', {
    text: '⚡️ MyCondition ⚡️', // Title của button
    class: 'btn-get-info',               // Thêm class nếu cần styling
    click: function () {
      // Khi click, mở URL trong một tab mới
      window.open(url, '_blank');
    }
  });

  // Append button vào topDiv
  topDiv.append(button);

  // Optionally: Styling cho button
  button.css({
    padding: '10px 20px',
    marginTop: '10px',
    backgroundColor: textColor,
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px'
  });

  // Hover effect
  button.hover(
    function () {
      $(this).css('backgroundColor', '#0056b3');
    },
    function () {
      $(this).css('backgroundColor', textColor);
    }
  );
}

/**
 * Phân tích URL và trả về object chứa baseUrl và params
 * @param {string} url - Đường dẫn cần phân tích
 * @returns {Object} - Object chứa baseUrl và params (dạng Map)
 */
function extractQuery(url) {
  // Nếu URL thiếu domain, thêm domain của trang hiện tại
  if (url.startsWith('/')) {
    url = `${window.location.origin}${url}`;
  }
  // Tạo đối tượng URL từ chuỗi url
  const urlObject = new URL(url);
  // Lấy baseUrl (phần URL trước dấu '?')
  const baseUrl = `${urlObject.origin}${urlObject.pathname}`;
  // Lấy params từ chuỗi query
  const params = new Map();
  urlObject.searchParams.forEach((value, key) => {
    params.set(key, value);
  });
  return {
    baseUrl: baseUrl,
    params: params
  };
}


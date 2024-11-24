(function () {
  try {
    // Kiểm tra và lấy giá trị crumbs
    if (
      typeof YAHOO !== 'undefined' &&
      YAHOO.JP &&
      YAHOO.JP.realestate &&
      YAHOO.JP.realestate.personal &&
      YAHOO.JP.realestate.personal.crumbs
    ) {
      const crumbs = YAHOO.JP.realestate.personal.crumbs;
      // Gửi thông tin crumbs qua CustomEvent
      window.dispatchEvent(new CustomEvent('crumbsData', { detail: { crumbs } }));
    } else {
      window.dispatchEvent(new CustomEvent('crumbsData', { detail: { crumbs: null } }));
    }
  } catch (e) {
    console.error('Error accessing crumbs:', e);
    window.dispatchEvent(new CustomEvent('crumbsData', { detail: { crumbs: null } }));
  }
})();

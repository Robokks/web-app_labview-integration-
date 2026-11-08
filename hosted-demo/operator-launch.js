/* Designer-only navigation to the dedicated display-only operator view. */
(() => {
  'use strict';
  function openOperator() {
    // Save the designer's current browser-local layout before opening the separate viewing page.
    document.getElementById('publish')?.click();
    window.location.assign('/operator.html');
  }
  document.getElementById('operator-open')?.addEventListener('click', openOperator);
  const mobilePreview=document.querySelector('.mobile-nav [data-mobile-nav="preview"]');
  if (mobilePreview) {
    const text=mobilePreview.querySelector('span:last-child');if(text)text.textContent='Operator';
    mobilePreview.setAttribute('aria-label','Open operator display');
    mobilePreview.addEventListener('click', event => {
      event.preventDefault();event.stopImmediatePropagation();openOperator();
    }, true);
  }
})();

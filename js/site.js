(function () {
  'use strict';

  // youtube-nocookie + rel=0: privacy-preserving domain, no related videos from other channels.
  function embed(id, title) {
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
    f.title = title;
    f.allow = 'autoplay; encrypted-media; picture-in-picture';
    f.allowFullscreen = true;
    return f;
  }

  // Hero player: the iframe replaces the poster in place.
  var player = document.querySelector('[data-player]');
  if (player) {
    player.querySelector('button').addEventListener('click', function () {
      player.replaceChildren(embed(player.dataset.id, player.dataset.title));
    });
  }

  // Library cards open the modal. Cards are real YouTube links, so they still work without JS
  // and modifier-clicks open a new tab.
  var modal = document.getElementById('boost-modal');
  var frame = modal.querySelector('.modal__frame');
  var caption = modal.querySelector('.modal__caption');
  var closeBtn = modal.querySelector('.modal__close');
  var returnFocus = null;

  function onKey(e) { if (e.key === 'Escape') closeModal(); }

  function openModal(id, title) {
    returnFocus = document.activeElement;
    frame.replaceChildren(embed(id, title));
    caption.textContent = title;
    modal.setAttribute('aria-label', title);
    modal.hidden = false;
    document.addEventListener('keydown', onKey);
    closeBtn.focus();
  }

  function closeModal() {
    modal.hidden = true;
    frame.replaceChildren();
    document.removeEventListener('keydown', onKey);
    if (returnFocus) returnFocus.focus();
  }

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === e.currentTarget) closeModal(); });

  document.querySelectorAll('[data-boost]').forEach(function (card) {
    card.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      openModal(card.dataset.id, card.dataset.title);
    });
  });

  // Forms: confirmation replaces the button label in place. If the background post fails,
  // fall back to a normal form submission so nothing is lost.
  document.querySelectorAll('form[data-rc-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      fetch(form.dataset.ajax || form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form)
      }).then(function (res) {
        if (!res.ok) throw new Error(res.status);
        return res.json();
      }).then(function (data) {
        // FormSubmit answers 200 with success "false" when delivery did not happen.
        if (String(data.success) !== 'true') throw new Error(data.message);
        btn.textContent = btn.dataset.done;
      }).catch(function () {
        form.submit();
      });
    });
  });
})();

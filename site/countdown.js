/**
 * Обратный отсчёт до начала мероприятия.
 * Измените TARGET_DATE на реальную дату начала Уральского бёрна.
 */
(function () {
  // Дата начала события (год, месяц - 1, день, час, минута)
  var TARGET_DATE = new Date(2026, 6, 1, 12, 0); // 1 июля 2026, 12:00

  var daysEl = document.getElementById('days');
  var hoursEl = document.getElementById('hours');
  var minutesEl = document.getElementById('minutes');
  var secondsEl = document.getElementById('seconds');

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function update() {
    var now = new Date();
    if (now >= TARGET_DATE) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      return;
    }
    var diff = TARGET_DATE - now;
    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((diff % (1000 * 60)) / 1000);
    daysEl.textContent = days;
    hoursEl.textContent = pad(hours);
    minutesEl.textContent = pad(minutes);
    secondsEl.textContent = pad(seconds);
  }

  update();
  setInterval(update, 1000);
})();

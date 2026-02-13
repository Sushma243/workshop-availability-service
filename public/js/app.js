(function () {
  const btnCheck = document.getElementById('btn-check');
  const resultsSection = document.getElementById('results-section');
  const requestSummary = document.getElementById('request-summary');
  const resultsList = document.getElementById('results-list');
  const errorMessage = document.getElementById('error-message');
  const loading = document.getElementById('loading');

  function getSelectedServices() {
    return Array.from(document.querySelectorAll('input[name="service"]:checked')).map(function (el) { return el.value; });
  }

  function getSelectedRepairs() {
    return Array.from(document.querySelectorAll('input[name="repair"]:checked')).map(function (el) { return el.value; });
  }

  function showLoading(show) {
    loading.hidden = !show;
    if (show) resultsSection.hidden = true;
  }

  function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.hidden = false;
  }

  function clearError() {
    errorMessage.hidden = true;
    errorMessage.textContent = '';
  }

  function renderRequestSummary(req) {
    requestSummary.innerHTML =
      'Request: <strong>' + (req.services.length ? req.services.join(', ') : '—') + '</strong> (services) · ' +
      '<strong>' + (req.repairs.length ? req.repairs.join(', ') : '—') + '</strong> (repairs) · ' +
      'Total hours: <strong>' + req.totalRequestedHours + 'h</strong> · ' +
      'Period: <strong>' + req.startDate + '</strong> to <strong>' + req.endDate + '</strong>';
  }

  function renderSchedule(schedule) {
    return schedule.map(function (job) {
      return '<span class="schedule-tag">' + job.jobName + ' ' + job.startHour + ':00–' + job.endHour + ':00 (' + job.duration + 'h)</span>';
    }).join('');
  }

  function renderSlot(slot) {
    return '<div class="slot-item">' +
      '<span class="slot-times">' + slot.checkIn + ' → ' + slot.checkOut + '</span>' +
      '<div class="slot-meta">' + slot.totalWorkHours + 'h work · ' + slot.totalDays + ' day(s)</div>' +
      '<div>' + renderSchedule(slot.schedule) + '</div>' +
      '</div>';
  }

  function renderWorkshop(workshop) {
    var card = document.createElement('div');
    card.className = 'workshop-card ' + (workshop.canFulfillRequest ? 'can-fulfill' : 'cannot-fulfill');

    var html = '<p class="workshop-name">' + workshop.workshopName + '</p>';
    if (!workshop.canFulfillRequest && workshop.missingServicesOrRepairs && workshop.missingServicesOrRepairs.length) {
      html += '<p class="workshop-missing">Missing: ' + workshop.missingServicesOrRepairs.join(', ') + '</p>';
    }
    if (workshop.availableSlots && workshop.availableSlots.length) {
      html += '<ul class="slots-list">';
      workshop.availableSlots.forEach(function (slot) {
        html += '<li>' + renderSlot(slot) + '</li>';
      });
      html += '</ul>';
    }
    card.innerHTML = html;
    return card;
  }

  btnCheck.addEventListener('click', function () {
    var services = getSelectedServices();
    var repairs = getSelectedRepairs();
    if (services.length === 0 && repairs.length === 0) {
      showError('Please select at least one service or repair.');
      resultsSection.hidden = false;
      return;
    }
    clearError();
    showLoading(true);
    resultsList.innerHTML = '';

    fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ services: services, repairs: repairs })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        showLoading(false);
        if (data.success && data.request) {
          renderRequestSummary(data.request);
          data.results.forEach(function (w) {
            resultsList.appendChild(renderWorkshop(w));
          });
          resultsSection.hidden = false;
        } else {
          showError(data.error || data.message || 'Request failed.');
          resultsSection.hidden = false;
        }
      })
      .catch(function (err) {
        showLoading(false);
        showError('Network error: ' + (err.message || 'Could not reach server.'));
        resultsSection.hidden = false;
      });
  });
})();

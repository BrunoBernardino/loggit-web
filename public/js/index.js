(() => {
  document.addEventListener('app-loaded', () => {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-button');
    const signupButton = document.getElementById('signup-button');

    const eventsList = document.getElementById('events');
    const topEventsList = document.getElementById('top-events');
    const addEventForm = document.getElementById('add-event-form');
    const addEventButton = document.getElementById('add-event-button');
    const eventNameInput = document.getElementById('event-name');
    const eventDateInput = document.getElementById('event-date');
    const monthNavigationPreviousButton = document.getElementById('month-navigation-previous');
    const monthNavigationNextButton = document.getElementById('month-navigation-next');
    const monthNavigationLabel = document.getElementById('current-month');
    const eventStatsList = document.getElementById('event-stats');

    let currentMonth = (new Date().toISOString()).substring(0, 7);

    async function login(event) {
      loginButton.textContent = 'Logging in...';
      await loginOrSignup(event, false);
      loginButton.textContent = 'Login';
    }

    async function signup(event) {
      signupButton.textContent = 'Signing up...';
      await loginOrSignup(event, true);
      signupButton.textContent = 'Signup';
    }

    let isLoggingInOrSigningUp = false;

    async function loginOrSignup(event, isSigningUp) {
      event.preventDefault();
      event.stopPropagation();

      if (isLoggingInOrSigningUp) {
        return;
      }

      isLoggingInOrSigningUp = true;
      window.app.showLoading();

      const email = emailInput.value;
      const password = passwordInput.value;

      const loginOrSignupMethod = isSigningUp ? window.app.dataUtils.createAccount : window.app.dataUtils.validateLogin;

      const { success, error } = await loginOrSignupMethod(email, password);

      if (success) {
        const { Swal } = window;

        Swal.fire(
          'Alright!',
          'That looks alright. Let\'s get on with it!',
          'success',
        );

        window.app.showValidSessionElements();
        loginForm.reset();
        await initializePage();
      } else {
        if (error) {
          window.app.showNotification(error, 'error');
        }
      }

      window.app.hideLoading();
      isLoggingInOrSigningUp = false;
    }

    function getEventItemHtmlElement(event) {
      const template = document.getElementById('event-item');

      // Clone the event template and add it to the list
      const clonedEvent = template.content.firstElementChild.cloneNode(true);
      clonedEvent.dataset.id = event.id;

      const nameElement = clonedEvent.querySelector('article span');
      nameElement.textContent = event.name;

      const dateElement = clonedEvent.querySelector('time');
      dateElement.textContent = window.app.utils.showFormattedDate(event.date);

      return clonedEvent;
    }

    function getTopEventItemHtmlElement(event) {
      const template = document.getElementById('top-event-item');

      // Clone the event template and add it to the list
      const clonedEvent = template.content.firstElementChild.cloneNode(true);
      clonedEvent.dataset.eventName = event.name;

      const nameElement = clonedEvent.querySelector('article span');
      nameElement.textContent = event.name;

      return clonedEvent;
    }

    function getEventStatHtmlElement(eventStat) {
      const template = document.getElementById('event-stat-item');

      // Clone the event template and add it to the list
      const clonedEvent = template.content.firstElementChild.cloneNode(true);
      clonedEvent.dataset.id = eventStat.id;

      const nameElement = clonedEvent.querySelector('span.name');
      nameElement.textContent = eventStat.name;

      const frequencyElement = clonedEvent.querySelector('span.frequency');
      frequencyElement.textContent = eventStat.frequency;

      const displayOptions = {};

      const lastDateYear = parseInt(eventStat.lastDate.substring(0, 4), 10);
      const currentYear = new Date().getFullYear();

      if (lastDateYear !== currentYear) {
        displayOptions.showYear = true;
      }

      const dateElement = clonedEvent.querySelector('time');
      dateElement.textContent = window.app.utils.showFormattedDate(eventStat.lastDate, displayOptions);

      return clonedEvent;
    }

    async function showData() {
      monthNavigationLabel.textContent = window.app.utils.showFormattedDate(currentMonth, {
        showDay: false,
        showYear: true,
        longMonth: true,
        longYear: true,
      });

      const allEvents = await window.app.dataUtils.fetchEvents();
      const monthEvents = await window.app.dataUtils.fetchEvents(currentMonth);

      // Calculate top events
      const eventsByName = {};

      // Group events by name, and count them
      allEvents.forEach((event) => {
        if (Object.prototype.hasOwnProperty.call(eventsByName, event.name)) {
          eventsByName[event.name].count += 1;
          if (event.date < eventsByName[event.name].firstLog) {
            eventsByName[event.name].firstLog = event.date;
          }
          if (event.date > eventsByName[event.name].lastLog) {
            eventsByName[event.name].lastLog = event.date;
          }
        } else {
          eventsByName[event.name] = {
            count: 1,
            firstLog: event.date,
            lastLog: event.date,
          };
        }
      });

      // Sort events by count, and truncate at maxTopEventCount
      const maxTopEventCount = 15;
      const topEvents = Object.keys(eventsByName)
        .map((eventName) => ({
          id: `${window.app.dataUtils.generateId()}`,
          name: eventName,
          count: eventsByName[eventName].count,
          date: '',
        }))
        .sort(window.app.utils.sortByCount)
        .slice(0, maxTopEventCount);

      // Sort and truncate again, but now for stats
      const maxTopEventStatsCount = 10;
      const eventStats = Object.keys(eventsByName)
        .map((eventName) => ({
          id: `${window.app.dataUtils.generateId()}`,
          name: eventName,
          count: eventsByName[eventName].count,
          frequency: window.app.utils.calculateFrequencyFromGrouppedEvent(eventsByName[eventName]),
          lastDate: eventsByName[eventName].lastLog,
        }))
        .sort(window.app.utils.sortByCount)
        .slice(0, maxTopEventStatsCount);

      // Show month's events
      eventsList.replaceChildren();
      for (const event of monthEvents) {
        const eventElement = getEventItemHtmlElement(event);

        eventElement.addEventListener('click', () => showEditEventModal(event));

        eventsList.appendChild(eventElement);
      }

      if (monthEvents.length === 0) {
        eventsList.innerHTML = '<span class="no-data">No events found for this month. Add some!</span>';
      }

      // Show stats
      eventStatsList.replaceChildren();
      for (const eventStat of eventStats) {
        const eventElement = getEventStatHtmlElement(eventStat);

        eventStatsList.appendChild(eventElement);
      }

      if (eventStats.length === 0) {
        eventStatsList.innerHTML = '<span class="no-data">There are no events yet. Add some!</span>';
      }

      // Show top events
      topEventsList.replaceChildren();
      for (const event of topEvents) {
        const eventElement = getTopEventItemHtmlElement(event);

        eventElement.addEventListener('click', (clickEvent) => quickAddEvent(clickEvent, event));

        topEventsList.appendChild(eventElement);
      }
    }

    async function navigateToMonth(month) {
      currentMonth = month;
      await showData();
    }

    async function navigateToPreviousMonth() {
      const previousMonthDate = new Date(`${currentMonth}-15`);
      previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
      const month = previousMonthDate.toISOString().substring(0, 7);

      await navigateToMonth(month);
    }

    async function navigateToNextMonth() {
      const currentMonthDate = new Date(`${currentMonth}-15`);
      currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
      const month = currentMonthDate.toISOString().substring(0, 7);

      const nextMonthDate = new Date();
      nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
      const nextMonth = nextMonthDate.toISOString().substring(0, 7);

      if (month > nextMonth) {
        window.app.showNotification('Cannot travel further into the future!', 'error');
        return;
      }

      await navigateToMonth(month);
    }

    async function initializePage() {
      await window.app.dataUtils.initializeDb();
      showData();
    }

    let isAddingEvent = false;

    async function addEvent(event) {
      event.preventDefault();
      event.stopPropagation();

      if (isAddingEvent) {
        return;
      }

      addEventButton.textContent = 'Adding...';
      isAddingEvent = true;
      window.app.showLoading();

      const name = eventNameInput.value;
      const date = eventDateInput.value;

      const parsedEvent = {
        id: 'newEvent',
        name,
        date,
      };

      const success = await window.app.dataUtils.saveEvent(parsedEvent);

      if (success) {
        window.app.showNotification('Event added successfully.');
        addEventForm.reset();
      }

      await showData();

      window.app.hideLoading();
      isAddingEvent = false;
      addEventButton.textContent = 'Add Event';
    }

    async function quickAddEvent(clickEvent, event) {
      eventNameInput.value = event.name;
      eventDateInput.value = '';

      await addEvent(clickEvent);
    }

    async function showEditEventModal(event) {
      const { Swal } = window;

      let isUpdating = false;

      await Swal.fire({
        template: '#edit-event-modal',
        focusConfirm: false,
        allowEscapeKey: true,
        preConfirm: async () => {
          const updatedEvent = {
            id: event.id,
            name: document.getElementById('edit-event-name').value,
            date: document.getElementById('edit-event-date').value,
          };

          const saveEventButton = Swal.getConfirmButton();

          if (isUpdating) {
            return false;
          }

          saveEventButton.textContent = 'Saving...';
          isUpdating = true;
          window.app.showLoading();

          const success = await window.app.dataUtils.saveEvent(updatedEvent);

          if (success) {
            window.app.showNotification('Event updated successfully.');
          }

          await showData();

          window.app.hideLoading();
          isUpdating = false;
          saveEventButton.textContent = 'Save';

          return Boolean(success);
        },
        preDeny: async () => {
          const deleteEventButton = Swal.getDenyButton();

          if (isUpdating) {
            return false;
          }

          const { isConfirmed } = await Swal.fire({
            title: 'Are you sure?',
            text: 'You won\'t be able to recover this event!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: 'red',
            confirmButtonText: 'Yes, delete it!',
          });

          if (isConfirmed) {
            deleteEventButton.textContent = 'Deleting...';
            isUpdating = true;
            window.app.showLoading();

            const success = await window.app.dataUtils.deleteEvent(event.id);

            if (success) {
              window.app.showNotification('Event deleted successfully.');
            }

            await showData();

            window.app.hideLoading();
            isUpdating = false;
            deleteEventButton.textContent = 'Delete';

            return Boolean(success);
          }

          return false;
        },
        willOpen: () => {
          document.getElementById('edit-event-name').value = event.name;
          document.getElementById('edit-event-date').value = event.date;
        },
      });
    }

    async function chooseMonthModal() {
      const { Swal } = window;

      const { value: newMonth } = await Swal.fire({
        template: '#choose-month-modal',
        focusConfirm: false,
        allowEscapeKey: true,
        preConfirm: () => {
          const monthInput = document.getElementById('choose-month-input').value;
          const month = monthInput.substring(0, 7);

          const nextMonthDate = new Date();
          nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
          const nextMonth = nextMonthDate.toISOString().substring(0, 7);

          if (month > nextMonth) {
            window.app.showNotification('Cannot travel further into the future!', 'error');
            return false;
          }

          return month;
        },
        willOpen: () => {
          document.getElementById('choose-month-input').value = `${currentMonth}-15`;
        },
      });

      if (newMonth) {
        await navigateToMonth(newMonth);
      }
    }

    if (window.app.isLoggedIn) {
      initializePage();
    }

    loginForm.addEventListener('submit', login);
    signupButton.addEventListener('click', signup);
    addEventForm.addEventListener('submit', addEvent);
    monthNavigationPreviousButton.addEventListener('click', navigateToPreviousMonth);
    monthNavigationNextButton.addEventListener('click', navigateToNextMonth);
    monthNavigationLabel.addEventListener('click', chooseMonthModal);
  });
})();

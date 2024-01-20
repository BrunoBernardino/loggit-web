import { Event } from '/lib/types.ts';
import {
  calculateCurrentMonthFrequencyFromGrouppedEvent,
  calculateFrequencyFromGrouppedEvent,
  checkForValidSession,
  commonInitializer,
  createAccount,
  deleteEvent,
  fetchEvents,
  saveEvent,
  showFormattedDate,
  ShowFormattedDateOptions,
  showNotification,
  showValidSessionElements,
  sortByCount,
  validateLogin,
} from './utils.ts';

interface EventStat {
  id: string;
  name: string;
  count: number;
  frequency: string;
  currentMonthFrequency: string;
  lastDate: string;
}

document.addEventListener('app-loaded', async () => {
  const user = await checkForValidSession();

  const loginForm = document.getElementById('login-form') as HTMLFormElement;
  const emailInput = document.getElementById('email') as HTMLInputElement;
  const passwordInput = document.getElementById('password') as HTMLInputElement;
  const loginButton = document.getElementById('login-button') as HTMLButtonElement;
  const signupButton = document.getElementById('signup-button') as HTMLButtonElement;

  const eventsList = document.getElementById('events')!;
  const topEventsList = document.getElementById('top-events')!;
  const addEventForm = document.getElementById('add-event-form') as HTMLFormElement;
  const addEventButton = document.getElementById('add-event-button') as HTMLButtonElement;
  const eventNameInput = document.getElementById('event-name') as HTMLInputElement;
  const eventDateInput = document.getElementById('event-date') as HTMLInputElement;
  const monthNavigationPreviousButton = document.getElementById('month-navigation-previous') as HTMLButtonElement;
  const monthNavigationNextButton = document.getElementById('month-navigation-next') as HTMLButtonElement;
  const monthNavigationLabel = document.getElementById('current-month')!;
  const eventStatsList = document.getElementById('event-stats')!;

  let currentMonth = (new Date().toISOString()).substring(0, 7);

  async function login(event: MouseEvent | SubmitEvent) {
    loginButton.textContent = 'Logging in...';
    await loginOrSignup(event, false);
    loginButton.textContent = 'Login';
  }

  async function signup(event: MouseEvent | SubmitEvent) {
    signupButton.textContent = 'Signing up...';
    await loginOrSignup(event, true);
    signupButton.textContent = 'Signup';
  }

  let isLoggingInOrSigningUp = false;

  async function loginOrSignup(event: MouseEvent | SubmitEvent, isSigningUp?: boolean) {
    event.preventDefault();
    event.stopPropagation();

    if (isLoggingInOrSigningUp) {
      return;
    }

    isLoggingInOrSigningUp = true;
    window.app.showLoading();

    const email = emailInput.value;
    const password = passwordInput.value;

    const loginOrSignupMethod = isSigningUp ? createAccount : validateLogin;

    const { success, error } = await loginOrSignupMethod(email, password);

    if (success) {
      showNotification('Logged in successfully.', 'success');

      showValidSessionElements();
      loginForm.reset();
      initializePage();
    } else {
      if (error) {
        showNotification('Invalid email/password.', 'error');
      }
    }

    window.app.hideLoading();

    isLoggingInOrSigningUp = false;
  }

  function getEventItemHtmlElement(event: Event) {
    const template = document.getElementById('event-item') as HTMLTemplateElement;

    // Clone the event template and add it to the list
    const clonedEvent = (template.content.firstElementChild as HTMLDivElement).cloneNode(true) as HTMLDivElement;
    clonedEvent.dataset.id = event.id;

    const nameElement = clonedEvent.querySelector('article span') as HTMLSpanElement;
    nameElement.textContent = event.name;

    const dateElement = clonedEvent.querySelector('time') as HTMLTimeElement;
    dateElement.textContent = showFormattedDate(event.date);

    return clonedEvent;
  }

  function getTopEventItemHtmlElement(event: Pick<Event, 'id' | 'name'> & { lastDate: string }) {
    const template = document.getElementById('top-event-item') as HTMLTemplateElement;

    // Clone the event template and add it to the list
    const clonedEvent = (template.content.firstElementChild as HTMLDivElement).cloneNode(true) as HTMLDivElement;
    clonedEvent.dataset.eventName = event.name;

    const nameElement = clonedEvent.querySelector('article span') as HTMLSpanElement;
    nameElement.textContent = event.name;

    const displayOptions: ShowFormattedDateOptions = {};

    const lastDateYear = parseInt(event.lastDate.substring(0, 4), 10);
    const currentYear = new Date().getFullYear();

    if (lastDateYear !== currentYear) {
      displayOptions.showYear = true;
    }

    const dateElement = clonedEvent.querySelector('time') as HTMLTimeElement;
    dateElement.textContent = showFormattedDate(event.lastDate, displayOptions);

    return clonedEvent;
  }

  function getEventStatHtmlElement(eventStat: EventStat) {
    const template = document.getElementById('event-stat-item') as HTMLTemplateElement;

    // Clone the event template and add it to the list
    const clonedEvent = (template.content.firstElementChild as HTMLDivElement).cloneNode(true) as HTMLDivElement;
    clonedEvent.dataset.id = eventStat.id;

    const nameElement = clonedEvent.querySelector('span.name') as HTMLSpanElement;
    nameElement.textContent = eventStat.name;

    const frequencyElement = clonedEvent.querySelector('span.frequency') as HTMLSpanElement;
    frequencyElement.textContent = user?.extra.show_current_month_stats_in_top_stats
      ? eventStat.currentMonthFrequency
      : eventStat.frequency;
    frequencyElement.title = user?.extra.show_current_month_stats_in_top_stats
      ? eventStat.frequency
      : `${eventStat.currentMonthFrequency} this month`;

    return clonedEvent;
  }

  function getEventStatEventHtmlElement(event: Pick<Event, 'date'>) {
    const clonedEvent = document.createElement('time');

    const displayOptions: ShowFormattedDateOptions = {
      longMonth: true,
    };

    const dateYear = parseInt(event.date.substring(0, 4), 10);
    const currentYear = new Date().getFullYear();

    if (dateYear !== currentYear) {
      displayOptions.showYear = true;
      displayOptions.longYear = true;
    }

    clonedEvent.textContent = showFormattedDate(event.date, displayOptions);

    return clonedEvent;
  }

  async function showData() {
    monthNavigationLabel.textContent = showFormattedDate(currentMonth, {
      showDay: false,
      showYear: true,
      longMonth: true,
      longYear: true,
    });

    const allEvents = await fetchEvents('all');
    const monthEvents = await fetchEvents(currentMonth);

    // Calculate top events
    const eventCountByName: Map<string, { count: number; firstLog: string; lastLog: string }> = new Map();
    const currentMonthEventCountByName: Map<string, { count: number; firstLog: string; lastLog: string }> = new Map();

    // Group events by name, and count them (total)
    allEvents.forEach((event) => {
      if (eventCountByName.has(event.name)) {
        const eventCount = eventCountByName.get(event.name)!;

        eventCount.count += 1;
        if (event.date < eventCount.firstLog) {
          eventCount.firstLog = event.date;
        }
        if (event.date > eventCount.lastLog) {
          eventCount.lastLog = event.date;
        }

        eventCountByName.set(event.name, eventCount);
      } else {
        eventCountByName.set(event.name, {
          count: 1,
          firstLog: event.date,
          lastLog: event.date,
        });
      }
    });

    // Group events by name, and count them (current month)
    (allEvents.filter((event) => event.date.startsWith(currentMonth))).forEach((event) => {
      if (currentMonthEventCountByName.has(event.name)) {
        const eventCount = currentMonthEventCountByName.get(event.name)!;

        eventCount.count += 1;
        if (event.date < eventCount.firstLog) {
          eventCount.firstLog = event.date;
        }
        if (event.date > eventCount.lastLog) {
          eventCount.lastLog = event.date;
        }

        currentMonthEventCountByName.set(event.name, eventCount);
      } else {
        currentMonthEventCountByName.set(event.name, {
          count: 1,
          firstLog: event.date,
          lastLog: event.date,
        });
      }
    });

    // Sort events by count
    const topEvents = [...eventCountByName.keys()]
      .map((eventName) => ({
        id: `fake-id`,
        name: eventName,
        count: eventCountByName.get(eventName)!.count,
        date: '',
        lastDate: eventCountByName.get(eventName)!.lastLog,
      }))
      .sort(sortByCount);

    // Sort and truncate again, but now for stats
    const maxTopEventStatsCount = 15;
    const eventStats = [...eventCountByName.keys()]
      .map((eventName) => ({
        id: `fake-id`,
        name: eventName,
        count: eventCountByName.get(eventName)!.count,
        frequency: calculateFrequencyFromGrouppedEvent(eventCountByName.get(eventName)!),
        currentMonthFrequency: currentMonthEventCountByName.get(eventName)
          ? calculateCurrentMonthFrequencyFromGrouppedEvent(
            currentMonthEventCountByName.get(eventName)!,
          )
          : '0x',
        lastDate: eventCountByName.get(eventName)!.lastLog,
      }))
      .sort(sortByCount)
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

      const events = allEvents.filter((event) => event.name === eventStat.name);

      eventElement.addEventListener('click', () => showEventStatModal(eventStat, events));

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

  async function navigateToMonth(month: string) {
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
      showNotification('Cannot travel further into the future!', 'error');
      return;
    }

    await navigateToMonth(month);
  }

  function initializePage() {
    showData();
    commonInitializer();
  }

  let isAddingEvent = false;

  async function addEvent(event: MouseEvent | SubmitEvent) {
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

    const success = await saveEvent(parsedEvent);

    if (success) {
      showNotification('Event added successfully.');
      addEventForm.reset();
    }

    await showData();

    window.app.hideLoading();
    isAddingEvent = false;
    addEventButton.textContent = 'Add Event';
  }

  async function quickAddEvent(clickEvent: MouseEvent | SubmitEvent, event: Pick<Event, 'name'>) {
    eventNameInput.value = event.name;
    eventDateInput.value = '';

    await addEvent(clickEvent);
  }

  async function showEditEventModal(event: Event) {
    const { Swal } = window;

    let isUpdating = false;

    await Swal.fire({
      template: '#edit-event-modal',
      focusConfirm: false,
      allowEscapeKey: true,
      preConfirm: async () => {
        const editEventNameInput = document.getElementById('edit-event-name') as HTMLInputElement;
        const editEventDateInput = document.getElementById('edit-event-date') as HTMLInputElement;

        const updatedEvent = {
          id: event.id,
          name: editEventNameInput.value,
          date: editEventDateInput.value,
        };

        const saveEventButton = Swal.getConfirmButton();

        if (isUpdating) {
          return false;
        }

        saveEventButton.textContent = 'Saving...';
        isUpdating = true;
        window.app.showLoading();

        const success = await saveEvent(updatedEvent);

        if (success) {
          showNotification('Event updated successfully.');
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
          text: "You won't be able to recover this event!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: 'red',
          confirmButtonText: 'Yes, delete it!',
        });

        if (isConfirmed) {
          deleteEventButton.textContent = 'Deleting...';
          isUpdating = true;
          window.app.showLoading();

          const success = await deleteEvent(event.id);

          if (success) {
            showNotification('Event deleted successfully.');
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
        (document.getElementById('edit-event-name') as HTMLInputElement).value = event.name;
        (document.getElementById('edit-event-date') as HTMLInputElement).value = event.date;
      },
    });
  }

  async function showEventStatModal(eventStat: EventStat, events: Event[]) {
    const { Swal } = window;

    await Swal.fire({
      template: '#event-stat-modal',
      focusConfirm: false,
      allowEscapeKey: true,
      willOpen: () => {
        const eventElements = events.map((event) => getEventStatEventHtmlElement(event));

        (document.getElementById('event-stat-name') as HTMLHeadingElement).innerText = eventStat.name;
        (document.getElementById('event-stat-frequency') as HTMLHeadingElement).innerText = eventStat.frequency;
        (document.getElementById('event-stat-current-frequency') as HTMLHeadingElement).innerText =
          `${eventStat.currentMonthFrequency} this month`;
        const eventStatEvents = document.getElementById('event-stat-events') as HTMLDivElement;

        eventStatEvents.innerText = '';
        eventElements.forEach((eventElement) => eventStatEvents.appendChild(eventElement));
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
        const monthInput = (document.getElementById('choose-month-input') as HTMLInputElement).value;
        const month = monthInput.substring(0, 7);

        const nextMonthDate = new Date();
        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
        const nextMonth = nextMonthDate.toISOString().substring(0, 7);

        if (month > nextMonth) {
          showNotification('Cannot travel further into the future!', 'error');
          return false;
        }

        return month;
      },
      willOpen: () => {
        (document.getElementById('choose-month-input') as HTMLInputElement).value = `${currentMonth}-15`;
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

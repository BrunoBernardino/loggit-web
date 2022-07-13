(() => {
  const cachedData = {
    events: [],
  };

  async function initializeApp() {
    window.app = window.app || {};
    initializeLoading();

    // if (navigator && navigator.serviceWorker) {
    //   navigator.serviceWorker.register('/public/js/sw.js');
    // }

    // Expose helper functions
    window.app.isLoggedIn = false;
    window.app.showNotification = showNotification;
    window.app.doLogout = doLogout;
    window.app.getUserSession = getUserSession;
    window.app.showValidSessionElements = showValidSessionElements;
    window.app.hideValidSessionElements = hideValidSessionElements;
    window.app.dataUtils = {
      validateLogin,
      createAccount,
      initializeDb,
      fetchEvents,
      saveEvent,
      deleteEvent,
      deleteAllData,
      exportAllData,
      importData,
      generateId,
    };
    window.app.utils = {
      showFormattedDate,
      sortByDate,
      sortByCount,
      calculateFrequencyFromGrouppedEvent,
      dateDiffInDays,
    };

    const checkForValidSession = async () => {
      const isUserLoggedIn = await isLoggedIn();

      if (isUserLoggedIn) {
        window.app.isLoggedIn = true;
        showValidSessionElements();

        const userSession = await getUserSession();

        if (userSession.trialExpirationDate) {
          const trialExpirationDate = new Date(userSession.trialExpirationDate);
          const now = new Date();

          if (userSession.subscriptionStatus !== 'active' && trialExpirationDate < now) {
            showNotification('Your trial has expired!', 'error');

            // Give people some time to logout or export
            setTimeout(() => {
              window.location.href = '/pricing';
            }, 10000);
          }
        }
      }
    };

    await checkForValidSession();

    document.dispatchEvent(new Event('app-loaded'));

    window.app.hideLoading();
  }

  function initializeLoading() {
    const loadingComponent = document.getElementById('loading');

    window.app.showLoading = () => loadingComponent.classList.remove('hide');
    window.app.hideLoading = () => loadingComponent.classList.add('hide');
  }

  function showValidSessionElements() {
    const elementsToShow = document.querySelectorAll('[data-has-valid-session]');
    const elementsToHide = document.querySelectorAll('[data-has-invalid-session]');

    elementsToShow.forEach((element) => element.classList.remove('hidden'));
    elementsToHide.forEach((element) => element.classList.add('hidden'));
  }

  function hideValidSessionElements() {
    const elementsToShow = document.querySelectorAll('[data-has-invalid-session]');
    const elementsToHide = document.querySelectorAll('[data-has-valid-session]');

    elementsToShow.forEach((element) => element.classList.remove('hidden'));
    elementsToHide.forEach((element) => element.classList.add('hidden'));
  }

  function showNotification(message, type = 'success') {
    const { Swal } = window;

    const Toast = window.Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: type === 'success' ? 2500 : 0,
      timerProgressBar: type === 'success',
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      },
    });

    Toast.fire({
      icon: type,
      title: message,
    });
  }

  async function doLogout() {
    try {
      const { userbase } = window;
      await userbase.signOut();
      hideValidSessionElements();

      Swal.fire('Alright!', 'No idea who you are right now.', 'success');
      return true;
    } catch (error) {
      const { Swal } = window;

      Swal.fire(
        'Something went wrong!',
        `Uh oh! Something wrong happened: ${error && error.message}`,
        'error',
      );
    }

    return false;
  }

  async function isLoggedIn() {
    try {
      const { userbase } = window;
      const { userbaseConfig } = window.app;
      const session = await userbase.init(userbaseConfig);
      if (session.user) {
        return true;
      }
    } catch (_error) {
      // Do nothing
    }

    return false;
  }

  async function getUserSession() {
    try {
      const { userbase } = window;
      const { userbaseConfig } = window.app;
      const session = await userbase.init(userbaseConfig);
      return session.user;
    } catch (_error) {
      // Do nothing
    }

    return null;
  }

  async function validateLogin(email, password) {
    try {
      const { userbase } = window;
      const { userbaseConfig } = window.app;
      await userbase.signIn({
        username: email,
        password,
        sessionLength: userbaseConfig.sessionLength,
        rememberMe: 'local',
      });
      return { success: true };
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }

  async function createAccount(email, password) {
    try {
      const { userbase } = window;
      const { userbaseConfig } = window.app;
      await userbase.signUp({
        username: email,
        password,
        sessionLength: userbaseConfig.sessionLength,
        rememberMe: 'local',
        email,
      });
      return { success: true };
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }

  function getEventFromItem(item) {
    try {
      return {
        id: item.itemId,
        name: item.item.name,
        date: item.item.date,
      };
    } catch (_error) {
      return null;
    }
  }

  async function loadItemsAsync() {
    const { userbase } = window;
    await userbase.openDatabase({
      databaseName: 'events',
      changeHandler: (items) => {
        const events = items
          .map(getEventFromItem)
          .filter((event) => Boolean(event));

        hasFinishedLoading.events = true;

        cachedData.events = events;
      },
    });
  }

  async function initializeDb() {
    try {
      const { userbase } = window;
      const { userbaseConfig } = window.app;
      await userbase.init(userbaseConfig);

      await loadItemsAsync();
    } catch (error) {
      console.log(error);
      showNotification(error, 'error');
    }
  }

  const hasFinishedLoading = {
    events: false,
  };

  async function fetchEvents(month) {
    try {
      // Very ugly, but... works.
      while (!hasFinishedLoading.events) {
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
      }

      const sortedEvents = cachedData.events
        .filter((event) => {
          if (!month) {
            return true;
          }

          if (event.date >= `${month}-01` && event.date <= `${month}-31`) {
            return true;
          }

          return false;
        })
        .sort(sortByDate)
        .reverse();

      return sortedEvents;
    } catch (error) {
      const { Swal } = window;

      Swal.fire({
        title: 'Uh-oh',
        text: 'Something went wrong fetching events.',
      });

      console.error(error);
    }

    return [];
  }

  async function saveEvent(event) {
    try {
      if (event.name.trim().length === 0) {
        showNotification('The event needs a valid name.', 'error');
        return false;
      }

      if (!isValidDate(event.date)) {
        event.date = new Date().toISOString().substring(0, 10);
      }

      const { userbase } = window;

      if (event.id === 'newEvent') {
        event.id = `${generateId()}`;

        await userbase.insertItem({
          databaseName: 'events',
          item: {
            name: event.name,
            date: event.date,
          },
          itemId: event.id,
        });
      } else {
        await userbase.updateItem({
          databaseName: 'events',
          item: {
            name: event.name,
            date: event.date,
          },
          itemId: event.id,
        });
      }

      return true;
    } catch (error) {
      const { Swal } = window;

      Swal.fire({
        title: 'Uh-oh',
        text: 'Something went wrong saving that event.',
      });

      console.error(error);
    }

    return false;
  }

  async function deleteEvent(eventId) {
    try {
      const { userbase } = window;

      await userbase.deleteItem({
        databaseName: 'events',
        itemId: eventId,
      });

      const cachedItemIndex = cachedData.events.findIndex(
        (event) => event.id === eventId,
      );
      if (cachedItemIndex !== -1) {
        cachedData.events.splice(cachedItemIndex, 1);
      }

      return true;
    } catch (error) {
      const { Swal } = window;

      Swal.fire({
        title: 'Uh-oh',
        text: 'Something went wrong deleting that event.',
      });

      console.error(error);
    }

    return false;
  }

  async function deleteAllData() {
    const events = await fetchEvents();

    const deleteEventChunks = splitArrayInChunks(events, 10);

    const { userbase } = window;

    for (const eventsToDelete of deleteEventChunks) {
      await userbase.putTransaction({
        databaseName: 'events',
        operations: eventsToDelete.map((event) => ({
          command: 'Delete',
          itemId: event.id,
        })),
      });

      // Wait a second, to avoid hitting rate limits
      await new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
    }

    cachedData.events.length = 0;
    hasFinishedLoading.events = false;
  }

  async function exportAllData() {
    // Don't export anything until we're done with the first full load
    if (!hasFinishedLoading.events) {
      return {};
    }

    try {
      const events = (await fetchEvents()).sort(sortByDate);
      return { events };
    } catch (error) {
      const { Swal } = window;

      Swal.fire({
        title: 'Uh-oh',
        text: 'Something went wrong exporting data.',
      });

      console.error(error);
    }

    return {};
  }

  async function importData(replaceData, events) {
    // Don't import anything until we're done with the first full load
    if (!hasFinishedLoading.events) {
      return false;
    }

    try {
      if (replaceData) {
        await deleteAllData();

        await initializeDb();

        // Very ugly, but... works.
        while (!hasFinishedLoading.events) {
          await new Promise((resolve) => {
            setTimeout(resolve, 100);
          });
        }
      }

      const finalEventsToAdd = [];

      for (const event of events) {
        const newEventId = `${generateId()}`;
        const newEvent = {
          id: newEventId,
          name: event.name,
          date: event.date,
        };

        finalEventsToAdd.push(newEvent);
      }

      const addEventChunks = splitArrayInChunks(
        finalEventsToAdd,
        10,
      );

      const { userbase } = window;

      for (const eventsToAdd of addEventChunks) {
        await userbase.putTransaction({
          databaseName: 'events',
          operations: eventsToAdd.map((event) => ({
            command: 'Insert',
            item: {
              name: event.name,
              date: event.date,
            },
            itemId: event.id,
          })),
        });

        // Wait a second, to avoid hitting rate limits
        await new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });
      }

      return true;
    } catch (error) {
      const { Swal } = window;

      Swal.fire({
        title: 'Uh-oh',
        text: 'Something went wrong importing data.',
      });

      console.error(error);
    }

    return false;
  }

  function generateId() {
    return `${Date.now().toString()}:${Math.random()}`;
  }

  function splitArrayInChunks(array, chunkLength) {
    const chunks = [];
    let chunkIndex = 0;
    const arrayLength = array.length;

    while (chunkIndex < arrayLength) {
      chunks.push(array.slice(chunkIndex, chunkIndex += chunkLength));
    }

    return chunks;
  }

  function sortByDate(objectA, objectB) {
    if (objectA.date < objectB.date) {
      return -1;
    }
    if (objectA.date > objectB.date) {
      return 1;
    }
    return 0;
  }

  function sortByCount(objectA, objectB) {
    if (objectA.count < objectB.count) {
      return 1;
    }
    if (objectA.count > objectB.count) {
      return -1;
    }
    return 0;
  }

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  function showFormattedDate(
    stringDate,
    { showDay = true, showYear = false, longMonth = false, longYear = false } = {},
  ) {
    const dateYear = parseInt(stringDate.substring(0, 4));
    const dateMonth = parseInt(stringDate.substring(5, 7), 10) - 1;
    const dateDay = parseInt(stringDate.substring(8, 10), 10);

    const monthName = longMonth ? months[dateMonth] : months[dateMonth].substring(0, 3);
    const yearName = longYear ? dateYear.toString() : `'${dateYear.toString().substring(2, 4)}`;

    if (showYear) {
      if (showDay) {
        return `${dateDay} ${monthName} ${yearName}`;
      }

      return `${monthName} ${yearName}`;
    }

    return `${dateDay} ${monthName}`;
  }

  function dateDiffInDays(startDate, endDate) {
    return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  function calculateFrequencyFromGrouppedEvent(groupedEvent) {
    const monthDifference = Math.round(
      Math.abs(dateDiffInDays(new Date(groupedEvent.firstLog), new Date(groupedEvent.lastLog)) / 30),
    );

    // This event has only existed for less than 6 months, so we can't know if it'll repeat any more
    if (monthDifference <= 6 && groupedEvent.count < 12) {
      return `${groupedEvent.count || 1}x / year`;
    }

    const frequencyNumberPerMonth = Math.round(
      groupedEvent.count / monthDifference,
    );

    // When potentially less than once per month, check frequency per year
    if (frequencyNumberPerMonth <= 1) {
      const frequencyNumberPerYear = Math.round(
        (groupedEvent.count / monthDifference) * 12,
      );

      if (frequencyNumberPerYear < 12) {
        return `${frequencyNumberPerYear || 1}x / year`;
      }
    }

    if (frequencyNumberPerMonth < 15) {
      return `${frequencyNumberPerMonth}x / month`;
    }

    const frequencyNumberPerWeek = Math.round(
      groupedEvent.count / monthDifference / 4,
    );

    if (frequencyNumberPerWeek < 7) {
      return `${frequencyNumberPerMonth}x / week`;
    }

    const frequencyNumberPerDay = Math.round(
      groupedEvent.count / monthDifference / 30,
    );

    return `${frequencyNumberPerDay}x / day`;
  }

  function isValidDate(dateObject) {
    return new Date(dateObject).toString() !== 'Invalid Date';
  }

  document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
  });
})();

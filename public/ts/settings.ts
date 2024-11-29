import { Event } from '/lib/types.ts';
import {
  checkForValidSession,
  commonInitializer,
  commonRequestHeaders,
  exportAllData,
  importData,
  showNotification,
} from './utils.ts';
import LocalData from './local-data.ts';
import Encryption from './encryption.ts';

document.addEventListener('app-loaded', async () => {
  const user = await checkForValidSession();

  const changeFrequencyForm = document.getElementById('change-frequency-form') as HTMLFormElement;
  const newFrequencySelect = document.getElementById('new-frequency') as HTMLSelectElement;
  const changeFrequencyButton = document.getElementById('change-frequency-button') as HTMLButtonElement;

  const importDataButton = document.getElementById('import-button') as HTMLButtonElement;
  const exportDataButton = document.getElementById('export-button') as HTMLButtonElement;

  const changeEmailForm = document.getElementById('change-email-form') as HTMLFormElement;
  const newEmailInput = document.getElementById('new-email') as HTMLInputElement;
  const changeEmailButton = document.getElementById('change-email-button') as HTMLButtonElement;

  const changePasswordForm = document.getElementById('change-password-form') as HTMLFormElement;
  const newPasswordInput = document.getElementById('new-password') as HTMLInputElement;
  const changePasswordButton = document.getElementById('change-password-button') as HTMLButtonElement;

  let isUpdating = false;

  async function changeFrequency(event: MouseEvent | SubmitEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (isUpdating) {
      return;
    }

    if (!user) {
      showNotification('You need to signup or login before changing your settings!', 'error');
      await new Promise((resolve) => setTimeout(resolve, 3000));
      window.location.href = '/';
      return;
    }

    isUpdating = true;
    window.app.showLoading();
    changeFrequencyButton.textContent = 'Changing...';

    const show_current_month_stats_in_top_stats = newFrequencySelect.value === 'true';

    try {
      window.app.showLoading();

      const headers = commonRequestHeaders;

      const session = LocalData.get('session')!;

      const body: { user_id: string; session_id: string; show_current_month_stats_in_top_stats: boolean } = {
        user_id: session.userId,
        session_id: session.sessionId,
        show_current_month_stats_in_top_stats,
      };

      await fetch('/api/user', { method: 'PATCH', headers, body: JSON.stringify(body) });

      showNotification('Frequency changed successfully!');
    } catch (error) {
      showNotification(error as string, 'error');
    }

    isUpdating = false;
    window.app.hideLoading();
    changeFrequencyButton.textContent = 'Change frequency';
  }

  async function importDataFile() {
    const { Swal } = window;

    if (isUpdating) {
      return;
    }

    if (!user) {
      showNotification('You need to signup or login before changing your settings!', 'error');
      await new Promise((resolve) => setTimeout(resolve, 3000));
      window.location.href = '/';
      return;
    }

    const importFileDialogResult = await Swal.fire({
      icon: 'warning',
      input: 'file',
      title: 'Choose JSON File',
      inputAttributes: {
        accept: 'text/pain,application/json,.json',
        'aria-label': 'Import your events',
      },
    });

    if (!importFileDialogResult || !importFileDialogResult.value) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (fileRead) => {
      const importFileContents = fileRead.target?.result;

      let importedFileData: { events?: Event[] } = {};

      try {
        importedFileData = JSON.parse(importFileContents!.toString());
      } catch (_error) {
        importedFileData = {};
      }

      if (!Object.prototype.hasOwnProperty.call(importedFileData, 'events')) {
        showNotification(
          'Could not parse the file. Please confirm what you chose is correct.',
          'error',
        );
        return;
      }

      const events = importedFileData.events || [];

      const mergeOrReplaceDialogResult = await Swal.fire({
        icon: 'question',
        title: 'Merge or Replace?',
        text: 'Do you want to merge this with your existing data, or replace it?',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'Merge',
        denyButtonText: 'Replace',
        cancelButtonText: 'Wait, cancel.',
      });

      if (
        mergeOrReplaceDialogResult.isConfirmed ||
        mergeOrReplaceDialogResult.isDenied
      ) {
        isUpdating = true;
        window.app.showLoading();

        const success = await importData(
          mergeOrReplaceDialogResult.isDenied,
          events,
        );

        isUpdating = false;
        window.app.hideLoading();

        if (success) {
          showNotification('Data imported successfully!');
        }
      }
    };

    reader.readAsText(importFileDialogResult.value);
  }

  async function exportData() {
    if (isUpdating) {
      return;
    }

    if (!user) {
      showNotification('You need to signup or login before changing your settings!', 'error');
      await new Promise((resolve) => setTimeout(resolve, 3000));
      window.location.href = '/';
      return;
    }

    isUpdating = true;
    window.app.showLoading();

    const fileName = ['loggit-data-export-', new Date().toISOString().substring(0, 19).replace(/:/g, '-'), '.json']
      .join('');

    const exportData = await exportAllData();

    const exportContents = JSON.stringify(exportData, null, 2);

    // Add content-type
    const jsonContent = ['data:application/json; charset=utf-8,', exportContents].join('');

    // Download the file
    const data = encodeURI(jsonContent);
    const link = document.createElement('a');
    link.setAttribute('href', data);
    link.setAttribute('download', fileName);
    link.click();
    link.remove();

    isUpdating = false;
    window.app.hideLoading();

    showNotification('Data exported successfully!');
  }

  async function changeEmail(event: MouseEvent | SubmitEvent) {
    event.preventDefault();
    event.stopPropagation();

    const { Swal } = window;

    if (isUpdating) {
      return;
    }

    if (!user) {
      showNotification('You need to signup or login before changing your settings!', 'error');
      await new Promise((resolve) => setTimeout(resolve, 3000));
      window.location.href = '/';
      return;
    }

    isUpdating = true;
    window.app.showLoading();
    changeEmailButton.textContent = 'Changing...';

    const newEmail = newEmailInput.value;

    try {
      window.app.showLoading();

      const headers = commonRequestHeaders;

      const session = LocalData.get('session')!;

      const body: { user_id: string; session_id: string; email: string; code?: string } = {
        user_id: session.userId,
        session_id: session.sessionId,
        email: newEmail,
      };

      await fetch('/api/user', { method: 'PATCH', headers, body: JSON.stringify(body) });

      window.app.hideLoading();

      const { value: code } = await Swal.fire({
        template: '#verification-code-modal',
        focusConfirm: false,
        allowEscapeKey: true,
        preConfirm: () => {
          const codeValue = (document.getElementById('verification-code-input') as HTMLInputElement).value;

          if (!codeValue) {
            showNotification('You need to submit a code!', 'error');
            return false;
          }

          return codeValue;
        },
        willOpen: () => {
          (document.getElementById('verification-code-input') as HTMLInputElement).value = '';
        },
      });

      window.app.showLoading();

      body.code = code;

      await fetch('/api/user', { method: 'PATCH', headers, body: JSON.stringify(body) });

      session.email = newEmail;

      LocalData.set('session', session);

      showNotification('Email changed successfully!');

      window.app.hideLoading();

      newEmailInput.value = '';
    } catch (error) {
      isUpdating = false;
      window.app.hideLoading();
      changeEmailButton.textContent = 'Change email';
      showNotification(error as string, 'error');
    }
  }

  async function changePassword(event: MouseEvent | SubmitEvent) {
    event.preventDefault();
    event.stopPropagation();

    const { Swal } = window;

    if (isUpdating) {
      return;
    }

    if (!user) {
      showNotification('You need to signup or login before changing your settings!', 'error');
      await new Promise((resolve) => setTimeout(resolve, 3000));
      window.location.href = '/';
      return;
    }

    isUpdating = true;
    window.app.showLoading();
    changePasswordButton.textContent = 'Changing...';

    const newPassword = newPasswordInput.value;

    try {
      window.app.showLoading();

      const headers = commonRequestHeaders;

      const session = LocalData.get('session')!;

      const passwordKey = await Encryption.getAuthKey(newPassword);
      const encryptedKeyPair = await Encryption.encrypt(JSON.stringify(session.keyPair), passwordKey);

      const body: { user_id: string; session_id: string; encrypted_key_pair: string; code?: string } = {
        user_id: session.userId,
        session_id: session.sessionId,
        encrypted_key_pair: encryptedKeyPair,
      };

      await fetch('/api/user', { method: 'PATCH', headers, body: JSON.stringify(body) });

      window.app.hideLoading();

      const { value: code } = await Swal.fire({
        template: '#verification-code-modal',
        focusConfirm: false,
        allowEscapeKey: true,
        preConfirm: () => {
          const codeValue = (document.getElementById('verification-code-input') as HTMLInputElement).value;

          if (!codeValue) {
            showNotification('You need to submit a code!', 'error');
            return false;
          }

          return codeValue;
        },
        willOpen: () => {
          (document.getElementById('verification-code-input') as HTMLInputElement).value = '';
        },
      });

      window.app.showLoading();

      body.code = code;

      await fetch('/api/user', { method: 'PATCH', headers, body: JSON.stringify(body) });

      showNotification('Password changed successfully!');

      window.app.hideLoading();

      newPasswordInput.value = '';
    } catch (error) {
      isUpdating = false;
      window.app.hideLoading();
      changePasswordButton.textContent = 'Change password / encryption key';
      showNotification(error as string, 'error');
    }
  }

  function initializePage() {
    newFrequencySelect.value = user?.extra.show_current_month_stats_in_top_stats ? 'true' : 'false';
    commonInitializer();
  }

  if (window.app.isLoggedIn) {
    initializePage();
  }

  changeFrequencyForm.addEventListener('submit', changeFrequency);

  importDataButton.addEventListener('click', importDataFile);
  exportDataButton.addEventListener('click', exportData);

  changeEmailForm.addEventListener('submit', changeEmail);
  changePasswordForm.addEventListener('submit', changePassword);
});

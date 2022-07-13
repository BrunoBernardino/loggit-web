(() => {
  document.addEventListener('app-loaded', () => {
    const importDataButton = document.getElementById('import-button');
    const exportDataButton = document.getElementById('export-button');

    const changeEmailForm = document.getElementById('change-email-form');
    const newEmailInput = document.getElementById('new-email');
    const changeEmailButton = document.getElementById('change-email-button');

    const changePasswordForm = document.getElementById('change-password-form');
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const changePasswordButton = document.getElementById('change-password-button');

    let isUpdating = false;

    async function importData() {
      const { Swal } = window;

      if (isUpdating) {
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
        const importFileContents = fileRead.target.result;

        let importedFileData = {};

        try {
          importedFileData = JSON.parse(importFileContents.toString());
        } catch (_error) {
          importedFileData = {};
        }

        if (!Object.prototype.hasOwnProperty.call(importedFileData, 'events')) {
          window.app.showNotification(
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

          const success = await window.app.dataUtils.importData(
            mergeOrReplaceDialogResult.isDenied,
            events,
          );

          isUpdating = false;
          window.app.hideLoading();

          if (success) {
            window.app.showNotification('Data imported successfully!');
          }
        }
      };

      reader.readAsText(importFileDialogResult.value);
    }

    async function exportData() {
      if (isUpdating) {
        return;
      }

      isUpdating = true;
      window.app.showLoading();

      const fileName = ['loggit-data-export-', new Date().toISOString().substring(0, 19).replace(/:/g, '-'), '.json']
        .join('');

      const exportData = await window.app.dataUtils.exportAllData();

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

      window.app.showNotification('Data exported successfully!');
    }

    async function changeEmail(event) {
      event.preventDefault();
      event.stopPropagation();

      if (isUpdating) {
        return;
      }

      isUpdating = true;
      window.app.showLoading();
      changeEmailButton.textContent = 'Changing...';

      const email = newEmailInput.value;

      try {
        await userbase.updateUser({
          username: email,
          email,
        });

        window.location.reload();
      } catch (error) {
        isUpdating = false;
        window.app.hideLoading();
        changeEmailButton.textContent = 'Change email';
        window.app.showNotification(error, 'error');
      }
    }

    async function changePassword(event) {
      event.preventDefault();
      event.stopPropagation();

      if (isUpdating) {
        return;
      }

      isUpdating = true;
      window.app.showLoading();
      changePasswordButton.textContent = 'Changing...';

      const currentPassword = currentPasswordInput.value;
      const newPassword = newPasswordInput.value;

      try {
        await userbase.updateUser({
          currentPassword,
          newPassword,
        });

        window.location.reload();
      } catch (error) {
        isUpdating = false;
        window.app.hideLoading();
        changePasswordButton.textContent = 'Change password / encryption key';
        window.app.showNotification(error, 'error');
      }
    }

    async function initializePage() {
      await window.app.dataUtils.initializeDb();
    }

    if (window.app.isLoggedIn) {
      initializePage();
    }

    importDataButton.addEventListener('click', importData);
    exportDataButton.addEventListener('click', exportData);

    changeEmailForm.addEventListener('submit', changeEmail);
    changePasswordForm.addEventListener('submit', changePassword);
  });
})();

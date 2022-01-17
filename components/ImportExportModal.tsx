import React, { useState } from 'react';
import styled from 'styled-components';
import Rodal from 'rodal';
import Swal from 'sweetalert2';

import Button from 'components/Button';
import { showNotification } from 'lib/utils';
import { exportAllData, importData } from 'lib/data-utils';
import { colors, fontSizes } from 'lib/constants';
import * as T from 'lib/types';

type ImportedFileData = {
  events?: T.Event[];
};

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  setIsLoading: (isLoading: boolean) => void;
}

const Container = styled.section`
  display: flex;
  flex-direction: column;
  flex: 1;
  background-color: ${colors().background};
  padding: 0 16px;
`;

const Label = styled.label`
  color: ${colors().inputLabel};
  font-size: ${fontSizes.inputLabel}px;
  font-weight: bold;
  text-align: left;
  margin-top: 38px;
`;

const Note = styled.span`
  color: ${colors().inputLabel};
  font-size: ${fontSizes.mediumText}px;
  font-weight: normal;
  text-align: left;
  margin-top: 30px;
`;

const ImportExportModal = (props: ImportExportModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isOpen, onClose, setIsLoading } = props;

  const onRequestImport = async () => {
    if (isSubmitting) {
      // Ignore sequential taps
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

      let importedFileData: ImportedFileData = {};

      try {
        importedFileData = JSON.parse(importFileContents.toString());
      } catch (error) {
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
        text:
          'Do you want to merge this with your existing data, or replace it?',
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
        setIsSubmitting(true);
        setIsLoading(true);

        const success = await importData(
          mergeOrReplaceDialogResult.isDenied,
          events,
        );

        setIsSubmitting(false);
        setIsLoading(false);

        if (success) {
          onClose();
        }
      }
    };

    reader.readAsText(importFileDialogResult.value);
  };

  const onRequestExport = async () => {
    if (isSubmitting) {
      // Ignore sequential taps
      return;
    }

    setIsSubmitting(true);

    const fileName = `data-export-${new Date()
      .toISOString()
      .substring(0, 19)
      .replace(/:/g, '-')}.json`;

    const exportData = await exportAllData();

    const exportContents = JSON.stringify(exportData, null, 2);

    // Add content-type
    const jsonContent = `data:application/json;charset=utf-8,${exportContents}`;

    // Download the file
    const data = encodeURI(jsonContent);
    const link = document.createElement('a');
    link.setAttribute('href', data);
    link.setAttribute('download', fileName);
    link.click();
    link.remove();

    setIsSubmitting(false);

    showNotification('Data exported successfully!');
  };

  return (
    <Rodal visible={isOpen} onClose={onClose} animation="slideDown">
      <Container>
        <Label>Import</Label>
        <Note>Import a JSON file exported from Loggit (v1 or v2) before.</Note>

        <Button
          element="a"
          href="https://loggit.net/import-export-file-format"
          type="secondary"
          style={{ margin: '20px 0', alignSelf: 'center' }}
        >
          Learn more
        </Button>

        <Button onClick={() => onRequestImport()} type="secondary" style={{ margin: '20px 0', alignSelf: 'center' }}>
          Import Data
        </Button>

        <Button onClick={() => onRequestExport()} type="primary" style={{ margin: '20px 0', alignSelf: 'center' }}>
          Export Data
        </Button>
      </Container>
    </Rodal>
  );
};

export default ImportExportModal;

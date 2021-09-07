import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import Rodal from 'rodal';
import Swal from 'sweetalert2';
import { RxDatabase } from 'rxdb';

import Button from 'components/Button';
import { showNotification } from 'lib/utils';
import { saveEvent, deleteEvent } from 'lib/data-utils';
import { colors, fontSizes } from 'lib/constants';
import * as T from 'lib/types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  id: string;
  name: string;
  date: string;
  reloadData: () => Promise<void>;
  db: RxDatabase;
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

const Input = styled.input`
  font-family: inherit;
  color: ${colors().inputField};
  font-size: ${fontSizes.inputField}px;
  font-weight: normal;
  text-align: left;
  margin-top: 8px;
  background-color: ${colors().background};
  padding: 5px 8px;
  border: 1px solid ${colors().secondaryBackground};
  border-radius: 5px;
  outline: none;
  &::-webkit-input-placeholder {
    color: ${colors().inputPlaceholder};
  }
  &:hover,
  &:focus,
  &:active {
    box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.2);
  }
`;

const StyledButton = styled(Button)`
  margin: 20px 0;
`;

const EventModal = (props: EventModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(props.name);
  const [date, setDate] = useState(props.date);

  const { id, isOpen, reloadData, db } = props;

  const onClose = useCallback(() => {
    const { onClose: closeModal } = props;
    setName('');
    setDate('');
    closeModal();
  }, []);

  const addEvent = async () => {
    if (isSubmitting) {
      // Ignore sequential clicks
      return;
    }

    setIsSubmitting(true);

    const parsedEvent: T.Event = {
      id: id || 'newEvent',
      name,
      date: date ? date.substr(0, 10) : '',
    };

    const success = await saveEvent(db, parsedEvent);

    setIsSubmitting(false);

    if (success) {
      showNotification(`Event ${id ? 'updated' : 'added'} successfully.`);
      onClose();
    }

    await reloadData();
  };

  const removeEvent = async () => {
    if (isSubmitting) {
      // Ignore sequential clicks
      return;
    }

    const confirmationResult = await Swal.fire({
      icon: 'warning',
      title: 'Are you sure?',
      text:
        'Are you sure you want to delete this event?\n\nThis action is irreversible.',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Yes!',
      denyButtonText: 'Nope, cancel.',
    });

    if (!confirmationResult || !confirmationResult.isConfirmed) {
      return;
    }

    setIsSubmitting(true);

    const success = await deleteEvent(db, id);

    setIsSubmitting(false);

    if (success) {
      showNotification('Event deleted successfully.');
      onClose();
    }

    await reloadData();
  };

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        addEvent();
      }
    },
    [],
  );

  return (
    <Rodal visible={isOpen} onClose={onClose} animation="slideDown">
      <Container>
        <Label>Name</Label>
        <Input
          placeholder="Volunteering"
          onChange={(event) => setName(event.target.value)}
          value={name}
          autoComplete="off"
          type="text"
          onKeyDown={onKeyDown}
        />

        <Label>Date</Label>
        <Input
          onChange={(event) => setDate(event.target.value)}
          value={date}
          autoComplete="off"
          type="date"
          onKeyDown={onKeyDown}
        />

        <StyledButton onClick={() => addEvent()} type="primary">
          {id ? 'Save Event' : 'Add Event'}
        </StyledButton>

        {Boolean(id) && (
          <StyledButton onClick={() => removeEvent()} type="delete">
            Delete Event
          </StyledButton>
        )}
      </Container>
    </Rodal>
  );
};

export default EventModal;

import React, { useState, useCallback } from 'react';
import styled from 'styled-components';

import Button from 'components/Button';
import Event from 'components/Event';
import { colors, fontSizes } from 'lib/constants';
import { showNotification, sortByCount } from 'lib/utils';
import { saveEvent } from 'lib/data-utils';
import * as T from 'lib/types';

interface AddEventProps {
  allEvents: T.Event[];
  reloadData: () => Promise<void>;
}

const Container = styled.section`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 0 16px;
  width: 86vw;
  margin: 10px 0 30px;

  @media only screen and (min-width: 800px) {
    max-width: 280px;
    margin-top: 5px;
    margin-bottom: 10px;
  }
`;

const ModalContainer = styled.section`
  display: flex;
  flex-direction: column;
  flex: 1;
  background-color: ${colors().background};
  padding: 0 16px;
  border-radius: 5px;
  margin-top: 20px;
  margin-right: -2px;
`;

const Logo = styled.img`
  margin-top: 10px;
  margin-bottom: 10px;
  height: 50px;
  resize-mode: contain;
  align-self: center;
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

const AddEvent = ({ allEvents, reloadData }: AddEventProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');

  const addEvent = async (copiedEvent?: T.Event) => {
    if (isSubmitting) {
      // Ignore sequential clicks
      return;
    }

    setIsSubmitting(true);

    const parsedEvent: T.Event = {
      id: 'newEvent',
      name,
      date,
    };

    if (copiedEvent) {
      parsedEvent.name = copiedEvent.name;
      parsedEvent.date = '';
    }

    const success = await saveEvent(parsedEvent);

    setIsSubmitting(false);

    if (success) {
      setName('');
      setDate('');
      showNotification('Event added successfully.');
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

  const eventsByName: { [key: string]: { count: number } } = {};

  // Group events by name, and count them
  allEvents.forEach((event) => {
    if (Object.prototype.hasOwnProperty.call(eventsByName, event.name)) {
      eventsByName[event.name].count += 1;
    } else {
      eventsByName[event.name] = {
        count: 1,
      };
    }
  });

  // Sort events by count, and truncate at maxTopEventCount
  const maxTopEventCount = 15;
  const topEvents = Object.keys(eventsByName)
    .map((eventName) => ({
      id: `${Date.now().toString()}:${Math.random()}`,
      name: eventName,
      count: eventsByName[eventName].count,
      date: '',
    }))
    .sort(sortByCount)
    .slice(0, maxTopEventCount);

  return (
    <Container>
      <Logo alt="Logo: pink checkmark" src="/images/logomark.svg" />
      {topEvents.map((event) => (
        <Event
          key={event.id}
          showDate={false}
          {...event}
          onClick={() => addEvent(event)}
        />
      ))}
      <ModalContainer>
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
          placeholder="Today"
          onChange={(event) => setDate(event.target.value)}
          value={date}
          autoComplete="off"
          type="date"
          onKeyDown={onKeyDown}
        />
        <Button
          isDisabled={isSubmitting}
          onClick={() => addEvent()}
          type="primary"
          style={{ margin: '20px 0' }}
        >
          {isSubmitting ? 'Adding...' : 'Add Event'}
        </Button>
      </ModalContainer>
    </Container>
  );
};

export default AddEvent;

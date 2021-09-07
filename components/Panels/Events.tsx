import React, { useState } from 'react';
import styled from 'styled-components';
import moment from 'moment';

import Event from 'components/Event';
import EventModal from 'components/EventModal';
import { colors, fontSizes } from 'lib/constants';
import * as T from 'lib/types';

interface EventsProps extends T.PanelProps {}

// user-agent sniffing sucks, but I couldn't figure out why this problem only happens on Safari (macOS and iOS)
const safariFix =
  typeof navigator !== 'undefined' &&
  navigator.userAgent &&
  navigator.userAgent.includes('Safari')
    ? 'max-block-size: 100%;'
    : '';

const Container = styled.section`
  display: flex;
  flex-direction: column;
  flex: 1;
  margin: 0 10px;
  max-height: 80vh;
  overflow: auto;
  ${safariFix}
`;

const NoEventsFoundText = styled.p`
  color: ${colors().secondaryText};
  text-align: center;
  align-items: center;
  flex: 1;
  display: flex;
  font-size: ${fontSizes.text}px;
`;

const NoEventsFound = () => {
  return (
    <NoEventsFoundText>
      No events found for this month.{'\n'}Add one!
    </NoEventsFoundText>
  );
};

const defaultEvent = {
  id: '',
  name: '',
  date: moment().format('YYYY-MM-DD'),
};

const Events = ({ events, reloadData, db }: EventsProps) => {
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [chosenEvent, setChosenEvent] = useState({
    ...defaultEvent,
  });

  const openEventModal = (event?: T.Event) => {
    setIsEventModalOpen(true);
    setChosenEvent({ ...(event || defaultEvent) });
  };

  const closeEventModal = () => {
    setIsEventModalOpen(false);
    setChosenEvent({ ...defaultEvent });
  };

  return (
    <Container>
      {events.map((event) => (
        <Event
          key={event.id}
          showDate
          {...event}
          onClick={() => openEventModal(event)}
        />
      ))}
      {events.length === 0 && <NoEventsFound />}
      <EventModal
        key={chosenEvent.id}
        isOpen={isEventModalOpen}
        onClose={() => closeEventModal()}
        reloadData={reloadData}
        db={db}
        {...chosenEvent}
      />
    </Container>
  );
};

export default Events;

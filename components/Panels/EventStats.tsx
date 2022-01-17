import React from 'react';
import styled from 'styled-components';
import moment from 'moment';

import EventStat from 'components/EventStat';
import { colors, fontSizes } from 'lib/constants';
import { sortByCount } from 'lib/utils';
import * as T from 'lib/types';

interface EventStatsProps {
  allEvents: T.Event[];
}

// user-agent sniffing sucks, but I couldn't figure out why this problem only happens on Safari (macOS and iOS)
const safariFix =
  typeof navigator !== 'undefined' &&
  navigator.userAgent &&
  navigator.userAgent.includes('Safari')
    ? 'max-block-size: 100%;'
    : '';

interface GroupedEvent {
  count: number;
  firstLog: string;
  lastLog: string;
}
interface GroupedEventsByName {
  [name: string]: GroupedEvent;
}

const calculateFrequencyFromGrouppedEvent = (groupedEvent: GroupedEvent) => {
  const monthDifference = Math.abs(
    moment(groupedEvent.firstLog, 'YYYY-MM-DD').diff(
      moment(groupedEvent.lastLog, 'YYYY-MM-DD'),
      'months',
    ),
  );

  // This event has only existed for less than a month, so we can't know if it'll repeat any more
  if (monthDifference <= 1) {
    return `${groupedEvent.count}x / year`;
  }

  const frequencyNumberPerMonth = Math.ceil(
    groupedEvent.count / monthDifference,
  );

  // When potentially less than once per month, check frequency per year
  if (frequencyNumberPerMonth === 1) {
    // Consider 6 months more of "nothing happening" between these, as it's a hard guess for something logged once a long time ago
    const frequencyNumberPerYear = Math.ceil(
      (groupedEvent.count / (monthDifference + 6)) * 12,
    );

    if (frequencyNumberPerYear < 12) {
      return `${frequencyNumberPerYear}x / year`;
    }
  }

  if (frequencyNumberPerMonth < 15) {
    return `${frequencyNumberPerMonth}x / month`;
  }

  const frequencyNumberPerWeek = Math.ceil(
    groupedEvent.count / monthDifference / 4,
  );

  if (frequencyNumberPerWeek < 7) {
    return `${frequencyNumberPerMonth}x / week`;
  }

  const frequencyNumberPerDay = Math.ceil(
    groupedEvent.count / monthDifference / 30,
  );

  return `${frequencyNumberPerDay}x / day`;
};

const Container = styled.section`
  display: flex;
  flex-direction: column;
  flex: 1;
  margin: 20px 10px;
  max-height: 80vh;
  overflow: auto;
  ${safariFix}
  width: 90vw;

  @media only screen and (min-width: 800px) {
    width: auto;
    margin: 0;
  }
`;

const NoEventsFoundText = styled.p`
  color: ${colors().secondaryText};
  text-align: center;
  align-items: center;
  flex: 1;
  display: flex;
  font-size: ${fontSizes.text}px;
`;

const EventStatsTipText = styled.p`
  color: ${colors().secondaryText};
  text-align: center;
  align-items: center;
  flex: 1;
  display: flex;
  font-size: ${fontSizes.text}px;
`;

const NoEventsFound = () => {
  return <NoEventsFoundText>No events found.{'\n'}Add one!</NoEventsFoundText>;
};

const EventStats = ({ allEvents }: EventStatsProps) => {
  const eventsByName: GroupedEventsByName = {};

  // Group events by name, and count them, and register first and last times logged
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
  const maxTopEventCount = 10;
  const topEvents = Object.keys(eventsByName)
    .map((eventName) => ({
      id: `${Date.now().toString()}:${Math.random()}`,
      name: eventName,
      count: eventsByName[eventName].count,
      frequency: calculateFrequencyFromGrouppedEvent(eventsByName[eventName]),
      lastDate: eventsByName[eventName].lastLog,
    }))
    .sort(sortByCount)
    .slice(0, maxTopEventCount);

  return (
    <Container>
      <EventStatsTipText>
        Below you can see some stats for your top 10 logged events, and the date
        it was last logged.
      </EventStatsTipText>
      {topEvents.map((topEvent) => (
        <EventStat key={topEvent.id} {...topEvent} />
      ))}
      {topEvents.length === 0 && <NoEventsFound />}
    </Container>
  );
};

export default EventStats;

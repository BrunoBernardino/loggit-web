import React from 'react';
import styled from 'styled-components';
import moment from 'moment';

import { colors, fontSizes } from 'lib/constants';

interface EventStatProps {
  name: string;
  frequency: string;
  lastDate: string;
}

const Container = styled.section`
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  padding: 14px 16px;
  border-radius: 12px;
  box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.1);
  background-color: ${colors().background};
  margin: 8px;
  cursor: pointer;
  min-width: 200px;
  &:hover {
    box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.3);
  }
`;

const Name = styled.span`
  color: ${colors().text};
  font-size: ${fontSizes.text}px;
  font-weight: normal;
  text-align: left;
`;

const Frequency = styled.div`
  color: ${colors().secondaryText};
  font-size: ${fontSizes.text}px;
  font-weight: normal;
  text-align: center;
  flex: 1;
`;

const Date = styled.div`
  color: ${colors().secondaryText};
  font-size: ${fontSizes.label}px;
  font-weight: normal;
  text-align: right;
  text-transform: uppercase;
`;

const EventStat = (props: EventStatProps) => {
  const eventDate = moment(props.lastDate, 'YYYY-MM-DD');
  return (
    <Container>
      <Name>{props.name}</Name>
      <Frequency>{props.frequency}</Frequency>
      <Date>{eventDate.format('DD MMM')}</Date>
    </Container>
  );
};

export default EventStat;

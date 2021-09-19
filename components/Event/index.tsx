import React from 'react';
import styled from 'styled-components';
import moment from 'moment';

import { colors, fontSizes } from 'lib/constants';

import * as T from 'lib/types';

interface EventProps extends T.Event {
  onClick: () => void;
  showDate: boolean;
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

const LeftColumn = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
`;

const Name = styled.span`
  color: ${colors().text};
  font-size: ${fontSizes.text}px;
  font-weight: normal;
  text-align: left;
`;

const Date = styled.div`
  color: ${colors().secondaryText};
  font-size: ${fontSizes.label}px;
  font-weight: normal;
  text-align: right;
`;

const Event = (props: EventProps) => {
  const eventDate = moment(props.date, 'YYYY-MM-DD');
  return (
    <Container onClick={props.onClick}>
      <LeftColumn>
        <Name style={props.showDate ? {} : { textAlign: 'center' }}>
          {props.name}
        </Name>
      </LeftColumn>
      {props.showDate ? <Date>{eventDate.format('D MMM')}</Date> : null}
    </Container>
  );
};

export default Event;

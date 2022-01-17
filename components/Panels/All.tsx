import React, { useState, useEffect } from 'react';
import moment from 'moment';
import styled from 'styled-components';
import { useAsync } from 'react-use';

import LogoutLink from 'modules/auth/LogoutLink';
import { Loading } from 'components';
import { getUserInfo, showNotification } from 'lib/utils';
import { initializeDb, fetchEvents } from 'lib/data-utils';
import * as T from 'lib/types';

import Navigation from './Navigation';
import Events from './Events';
import AddEvent from './AddEvent';
import Settings from './Settings';
import EventStats from './EventStats';

const Wrapper = styled.main`
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: flex-start;
  flex-direction: column-reverse;
  max-width: 100vw;

  @media only screen and (min-width: 800px) {
    flex-direction: row;
  }
`;

const LeftSide = styled.section`
  display: flex;
  flex: 1;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
`;

const All = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [monthInView, setMonthInView] = useState(moment().format('YYYY-MM'));
  const [theme, setTheme] = useState<T.Theme>('light');
  const [events, setEvents] = useState<T.Event[]>([]);
  const [allEvents, setAllEvents] = useState<T.Event[]>([]);

  type ReloadData = (options?: {
    monthToLoad?: string;
    isComingFromEmptyState?: boolean;
  }) => Promise<void>;
  const reloadData: ReloadData = async ({ monthToLoad } = {}) => {
    setIsLoading(true);

    const fetchedEvents = await fetchEvents(monthToLoad || monthInView);
    setEvents(fetchedEvents);

    const fetchedAllEvents = await fetchEvents();
    setAllEvents(fetchedAllEvents);

    setIsLoading(false);
  };

  const changeMonthInView = async (month: string) => {
    const nextMonth = moment().add(1, 'month').format('YYYY-MM');

    if (month > nextMonth) {
      showNotification('Cannot travel further into the future!', 'error');
      return;
    }

    setMonthInView(month);

    await reloadData({ monthToLoad: month });
  };

  useAsync(async () => {
    if (typeof window !== 'undefined') {
      const userInfo = getUserInfo();
      setTheme(userInfo.theme || 'light');

      await initializeDb();

      await reloadData();
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.getElementsByTagName('html')[0].classList.add('theme-dark');
      document.getElementsByTagName('body')[0].classList.add('theme-dark');
    }
  }, [theme]);

  return (
    <Wrapper className="wrapper">
      <Loading isShowing={isLoading} />
      <LeftSide>
        <Navigation
          changeMonthInView={changeMonthInView}
          monthInView={monthInView}
        />
        <Wrapper>
          <EventStats allEvents={allEvents} />
          <Events
            monthInView={monthInView}
            events={events}
            reloadData={reloadData}
          />
        </Wrapper>
      </LeftSide>
      <AddEvent allEvents={allEvents} reloadData={reloadData} />
      <Settings
        currentTheme={theme}
        updateTheme={setTheme}
        setIsLoading={setIsLoading}
        reloadData={reloadData}
      />
      <LogoutLink />
    </Wrapper>
  );
};

export default All;

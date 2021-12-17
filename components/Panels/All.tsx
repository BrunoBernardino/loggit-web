import React, { useState, useRef, useEffect } from 'react';
import moment from 'moment';
import styled from 'styled-components';
import { useAsync } from 'react-use';
import { RxDatabase } from 'rxdb';

import LogoutLink from 'modules/auth/LogoutLink';
import { Loading } from 'components';
import { getUserInfo, showNotification } from 'lib/utils';
import { initializeDb, fetchEvents, fetchAllEvents } from 'lib/data-utils';
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
  flex-direction: row;
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
  const [syncToken, setSyncToken] = useState('');
  const [theme, setTheme] = useState<T.Theme>('light');
  const [events, setEvents] = useState<T.Event[]>([]);
  const [allEvents, setAllEvents] = useState<T.Event[]>([]);
  const db = useRef<RxDatabase>(null);

  type ReloadData = (options?: {
    monthToLoad?: string;
    isComingFromEmptyState?: boolean;
  }) => Promise<void>;
  const reloadData: ReloadData = async ({ monthToLoad } = {}) => {
    setIsLoading(true);

    const fetchedEvents = await fetchEvents(
      db.current,
      monthToLoad || monthInView,
    );
    setEvents(fetchedEvents);

    const fetchedAllEvents = await fetchAllEvents(db.current);
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
      setSyncToken(userInfo.syncToken);

      const initializedDb = await initializeDb(userInfo.syncToken);
      db.current = initializedDb;

      await reloadData();

      showNotification(
        'Data is continuously synchronizing in the background. Navigate between months to see the latest data.',
      );
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
            db={db.current}
          />
        </Wrapper>
      </LeftSide>
      <AddEvent allEvents={allEvents} reloadData={reloadData} db={db.current} />
      <Settings
        syncToken={syncToken}
        db={db.current}
        currentTheme={theme}
        updateTheme={setTheme}
      />
      <LogoutLink db={db.current} />
    </Wrapper>
  );
};

export default All;

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Rodal from 'rodal';
import { RxDatabase } from 'rxdb';

import SegmentedControl from 'components/SegmentedControl';
import Button from 'components/Button';
import IconButton from 'components/IconButton';
import ImportExportModal from 'components/ImportExportModal';
import { colors, fontSizes } from 'lib/constants';
import { doLogin, showNotification } from 'lib/utils';
import * as T from 'lib/types';

import appPackage from '../../package.json';

interface SettingsProps {
  currentTheme: T.Theme;
  updateTheme: (theme: T.Theme) => void;
  syncToken: string;
  db: RxDatabase;
}

// @ts-ignore manually added
const { build: appBuild, version: appVersion } = appPackage;

const SettingsButton = styled(IconButton)`
  top: 8px;
  right: 70px;
  position: absolute;
`;

const Container = styled.section`
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: stretch;
  flex-direction: column;
  background-color: ${colors().background};
`;

const Label = styled.span`
  color: ${colors().inputLabel};
  font-size: ${fontSizes.inputLabel}px;
  font-weight: bold;
  text-align: left;
  margin-top: 38px;
`;

const StyledSegmentedControl = styled(SegmentedControl)`
  margin: 15px auto 10px;
  width: 96%;
`;

const BottomContainer = styled.section`
  display: flex;
  flex: 0.5;
  flex-direction: column;
`;

const Version = styled.p`
  color: ${colors().secondaryText};
  font-size: ${fontSizes.smallText}px;
  font-weight: normal;
  text-align: center;
  margin-top: 30px;
`;

const ImportExportButton = styled(Button)`
  margin: 5px auto 10px;
  align-self: center;
`;

const HelpButton = styled(Button)`
  margin: 0 auto 10px;
  align-self: center;
`;

const themeLabels = ['Light', 'Dark'];
const themeValues: T.Theme[] = ['light', 'dark'];

const Settings = ({
  currentTheme,
  updateTheme,
  syncToken,
  db,
}: SettingsProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);
  const [theme, setTheme] = useState(currentTheme);

  useEffect(() => {
    setTheme(currentTheme);
  }, [currentTheme]);

  const saveTheme = async (newTheme: T.Theme) => {
    if (isSubmitting) {
      // Ignore sequential taps
      return;
    }

    setIsSubmitting(true);

    const success = doLogin(syncToken, newTheme);

    if (success) {
      updateTheme(newTheme);
      return;
    }

    if (success) {
      showNotification('Settings saved successfully.');
    }
  };

  const selectedThemeIndex = themeValues.findIndex(
    (_theme) => theme === _theme,
  );

  return (
    <>
      <SettingsButton
        icon="settings"
        size={26}
        color={colors().secondaryButtonBackground}
        onClick={() => setIsSettingsModalOpen(true)}
      />
      <Rodal
        visible={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        animation="slideDown"
      >
        <Container>
          <Label>Theme</Label>
          <StyledSegmentedControl
            values={themeLabels}
            selectedIndex={selectedThemeIndex === -1 ? 0 : selectedThemeIndex}
            onChange={(selectedSegmentIndex: number) => {
              setTheme(themeValues[selectedSegmentIndex]);
              saveTheme(themeValues[selectedSegmentIndex]);
            }}
          />
          <BottomContainer>
            <Version>
              v{appVersion}-{appBuild}
            </Version>
            <ImportExportButton
              onClick={() => setIsImportExportModalOpen(true)}
              type="secondary"
            >
              Import or Export Data
            </ImportExportButton>
            <HelpButton
              element="a"
              href="mailto:help@loggit.net"
              type="primary"
            >
              Get Help
            </HelpButton>
          </BottomContainer>
          <ImportExportModal
            db={db}
            syncToken={syncToken}
            isOpen={isImportExportModalOpen}
            onClose={() => setIsImportExportModalOpen(false)}
          />
        </Container>
      </Rodal>
    </>
  );
};

export default Settings;

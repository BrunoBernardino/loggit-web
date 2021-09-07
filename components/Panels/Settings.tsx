import React, { useState } from 'react';
import styled from 'styled-components';
import Rodal from 'rodal';
import { RxDatabase } from 'rxdb';

import Button from 'components/Button';
import IconButton from 'components/IconButton';
import ImportExportModal from 'components/ImportExportModal';
import { colors, fontSizes } from 'lib/constants';

import appPackage from '../../package.json';

interface SettingsProps {
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

const Settings = ({ syncToken, db }: SettingsProps) => {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);

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
          <Label>Settings</Label>
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

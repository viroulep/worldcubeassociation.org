import React from 'react';
import { Message, List } from 'semantic-ui-react';

import {
  personUrl,
  adminCheckExistingResultsUrl,
  adminCADUrl,
} from '../../requests/routes.js.erb';

// FIXME: add the optional "notify wfc" if adding an additional competitor.
// easy if creating a new person, what if it's a new returning competitor?
const AfterCreateMessage = ({ response }) => {
  const { sentResult } = response;
  const { personId, competitionId } = sentResult;
  return (
    <Message positive>
      <Message.Header>
        Result for
        {' '}
        <a href={personUrl(personId)} target="_blank" rel="noreferrer">{personId}</a>
        {' '}
        created!
      </Message.Header>
      <div>
        Please make sure to:
        <List ordered>
          <List.Item>
            <a
              href={`/results/admin/check_regional_record_markers.php?competitionId=${competitionId}&show=Show`}
              target="_blank"
              rel="noreferrer"
            >
              Check Records
            </a>
          </List.Item>
          <List.Item>
            <a
              href={adminCheckExistingResultsUrl(competitionId)}
              target="_blank"
              rel="noreferrer"
            >
              Check Competition Validators
            </a>
          </List.Item>
          <List.Item>
            <a
              href={adminCADUrl}
              target="_blank"
              rel="noreferrer"
            >
              Run Compute Auxiliary Data
            </a>
          </List.Item>
        </List>
      </div>
    </Message>
  );
};

export default AfterCreateMessage;

import React from 'react';
import {
  Form, Grid,
} from 'semantic-ui-react';
import _ from 'lodash';

import AttemptResultField from '../AttemptResultField/AttemptResultField';
import MarkerField from '../AttemptResultField/MarkerField';
import { average, best, formatAttemptResult } from '../../wca-live/attempts';

const AttemptsForm = ({
  state, setState, eventId, computeAverage,
}) => {
  const { attempts, markerBest, markerAvg } = state;

  // FIXME: we use padded here because Bootstrap's row conflicts with
  // FUI's row and messes up the negative margins... :(
  /* eslint react/no-array-index-key: "off" */
  return (
    <Form>
      <Grid stackable padded columns={2}>
        <Grid.Column className="attempts-column">
          {attempts.map((attempt, index) => (
            <AttemptResultField
              key={index}
              eventId={eventId}
              label={`Attempt ${index + 1}`}
              initialValue={attempt}
              value={attempt}
              onChange={(value) => setState((prev) => ({
                ...prev,
                attempts: _.set(prev.attempts, [index], value),
              }))}
            />
          ))}
        </Grid.Column>
        <Grid.Column>
          <Form.Input
            label="Best"
            readOnly
            value={formatAttemptResult(best(attempts), eventId)}
            action={(
              <MarkerField
                onChange={(ev, { value }) => setState((prev) => ({
                  ...prev,
                  markerBest: value,
                }))}
                marker={markerBest}
              />
            )}
          />
          {computeAverage && (
          <Form.Input
            label="Average"
            readOnly
            value={formatAttemptResult(average(state.attempts, eventId), eventId)}
            action={(
              <MarkerField
                onChange={(ev, { value }) => setState((prev) => ({
                  ...prev,
                  markerAvg: value,
                }))}
                marker={markerAvg}
              />
            )}
          />
          )}
        </Grid.Column>
      </Grid>
    </Form>
  );
};

export default AttemptsForm;

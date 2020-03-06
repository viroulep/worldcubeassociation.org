import React, { Fragment } from 'react';
import AttemptField from '../AttemptField/AttemptField';
import MarkerField from '../MarkerField/MarkerField';

import {
  formatAttemptResult,
} from 'wca/attempts';
import { setAt } from 'wca/utils';
import { best, average } from 'wca/stats';

const AttemptList = ({
  attempts,
  setAttempts,
  eventId,
  savedResult,
  markerAvg,
  setMarkerAvg,
  markerBest,
  setMarkerBest,
  solveCount,
}) => {
  const computeAverage =
    [3, 5].includes(solveCount) && eventId !== '333mbf';
  return (
    <Fragment>
      {attempts.map((attempt, index) => (
        <div className="col-xs-12 edit-result-attempt" key={index}>
          <AttemptField
            eventId={eventId}
            label={`Attempt ${index + 1}`}
            initialValue={attempt}
            savedValue={savedResult.attempts[index]}
            onValue={value => setAttempts(setAt(attempts, index, value)) }
          />
        </div>
      ))}
      <div className="col-xs-6 computed-cell">
        <div>
          <div className="value">
            <b>Best</b>: {formatAttemptResult(best(attempts), eventId)}
            {' '}(was:{' '}
            {formatAttemptResult(best(savedResult.attempts), eventId)}
            {savedResult.regional_single_record})
          </div>
          <div className="marker">
            Marker:
            <MarkerField onChange={setMarkerBest} marker={markerBest} />
          </div>
        </div>
      </div>
      <div className="col-xs-6 computed-cell">
        {computeAverage && (
          <div>
            <div className="value">
              <b>Average</b>:{' '}
              {formatAttemptResult(
                average(attempts, eventId, solveCount),
                eventId,
                true
              )}
              {' '}(was:{' '}
              {formatAttemptResult(
                average(savedResult.attempts, eventId, solveCount),
                eventId,
                true
              )}
              {savedResult.regional_average_record})
            </div>
            <div className="marker">
              Marker:
              <MarkerField onChange={setMarkerAvg} marker={markerAvg} />
            </div>
          </div>
        )}
      </div>
    </Fragment>
  );
};

export default AttemptList;

import React, { useState, useEffect, useRef } from 'react';

import AttemptField from '../AttemptField/AttemptField';
import MarkerField from '../MarkerField/MarkerField';
import { setAt, times, trimTrailingZeros } from 'wca/utils';
import {
  formatAttemptResult,
} from 'wca/attempts';
import formats from 'wca/formats.js.erb';
import { best, average } from 'wca/stats';
import { savableComponent } from 'requests/savable';
import { resultResourceUrl } from 'requests/routes.js.erb';
import { ErrorList, InfoList } from 'requests/Lists';
import DeleteButton from 'requests/DeleteButton';
import cn from 'classnames';
import _ from 'lodash';

const ResultForm = savableComponent(({
  id,
  originalResult,
  saveState,
}) => {
  const [savedResult, setSavedResult] = useState(originalResult);
  const [attempts, setAttempts] = useState([]);
  const [errors, setErrors] = useState([]);
  const [infos, setInfos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [markerBest, setMarkerBest] = useState("");
  const [markerAvg, setMarkerAvg] = useState("");

  const eventId = originalResult.event_id;
  const solveCount = originalResult.format_id ?
    formats.byId[originalResult.format_id].expectedSolveCount : 0;
  const computeAverage =
    [3, 5].includes(solveCount) && eventId !== '333mbf';

  useEffect(() => {
    setAttempts(
      times(solveCount, index =>
        (originalResult.attempts && originalResult.attempts[index]) || 0)
    );
    setMarkerBest(originalResult.regional_single_record || "");
    setMarkerAvg(originalResult.regional_average_record || "");
  }, [originalResult]);



  const hasChanges = () => {
    return !_.isEqual([
        // Original result always has 5 attempts
        savedResult.attempts.slice(0, solveCount),
        savedResult.regional_single_record,
        savedResult.regional_average_record
      ],
      [attempts, markerBest, markerAvg]);
  };

  const toResult = () => {
    let res = {
      regionalSingleRecord: markerBest,
      regionalAverageRecord: markerAvg,
      best: best(attempts),
      average: average(attempts, eventId, solveCount),
    };
    attempts.map((a, index) => res[`value${index+1}`] = a);
    return { result: res };
  };

  const saveRecord = () => {
    setInfos([]);
    setErrors([]);
    saveState(toResult(), onRequestSuccess);
  };

  const onRequestSuccess = response => {
    if (response.status == "ok") {
      setSavedResult({
        ...savedResult,
        attempts: attempts,
        regional_single_record: markerBest,
        regional_average_record: markerAvg,
      });
      setInfos(response.infos);
    } else {
      setErrors(response.errors);
    }
  };

  return (
    <div>
      <div className="row">
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
        {errors.length > 0 && (
          <div className="col-xs-12">
            <ErrorList items={errors} />
          </div>
        )}
        {infos.length > 0 && (
          <div className="col-xs-12">
            <InfoList items={infos} />
          </div>
        )}
        <div className="col-xs-12">
          <button
            className={cn("btn", "btn-primary", { saving })}
            disabled={!hasChanges()}
            style={{marginRight: "15px"}}
            onClick={saveRecord}
          >
            Save
          </button>
          <DeleteButton url={resultResourceUrl(id)} />
        </div>
      </div>
    </div>
  );
}, resultResourceUrl);

const getInputs = container => {
  return Array.from(container.querySelectorAll('input, button')).filter(
    input => !input.disabled
  );
};

const useKeyNavigation = container => {
  useEffect(() => {
    if (!container) return;
    const handleKeyPress = event => {
      if (event.key === 'Escape') {
        event.target.blur && event.target.blur();
        return;
      }
      if (
        ['ArrowUp', 'ArrowDown'].includes(event.key) &&
        container.querySelector('[aria-expanded="true"]')
      ) {
        /* Don't interrupt navigation within competitor select list. */
        return;
      }
      if (!['ArrowUp', 'ArrowDown', 'Enter', 'Tab'].includes(event.key)) return;
      if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
        /* Prevent page scrolling. */
        event.preventDefault();
      }
      if (event.target.tagName === 'INPUT') {
        /* Blur the current input first, as it may affect which fields are disabled. */
        event.target.blur();
      }
      /* Let Tab be handled as usually. */
      if (event.key === 'Tab') return;
      /* Other handlers may change which fields are disabled, so let them run first. */
      setTimeout(() => {
        const inputs = getInputs(container);
        const index = inputs.findIndex(input => event.target === input);
        if (index === -1) return;
        const mod = n => (n + inputs.length) % inputs.length;
        if (event.key === 'ArrowUp') {
          const previousElement = inputs[mod(index - 1)];
          previousElement.focus();
          previousElement.select && previousElement.select();
        } else if (
          event.key === 'ArrowDown' ||
          (event.target.tagName === 'INPUT' && event.key === 'Enter')
        ) {
          const nextElement = inputs[mod(index + 1)];
          nextElement.focus();
          nextElement.select && nextElement.select();
        }
      }, 0);
    };
    container.addEventListener('keydown', handleKeyPress);
    return () => container.removeEventListener('keydown', handleKeyPress);
  }, [container]);

  useEffect(() => {
    if (!container) return;
    const handleKeyPress = event => {
      if (
        ['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key) &&
        event.target === document.body
      ) {
        const [firstInput] = getInputs(container);
        if (firstInput) {
          firstInput.focus();
          firstInput.select();
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [container]);
};

export default ResultForm;

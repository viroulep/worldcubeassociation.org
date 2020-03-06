import React, { useState, useEffect, useRef } from 'react';

import AttemptList from './AttemptList';
import RoundInfo from './RoundInfo'
import PersonData from './PersonData'
import { times, trimTrailingZeros } from 'wca/utils';
import formats from 'wca/formats.js.erb';
import { best, average } from 'wca/stats';
import { savableComponent } from 'requests/savable';
import { resultResourceUrl } from 'requests/routes.js.erb';
import { ErrorList, InfoList } from 'requests/Lists';
import countries from 'wca/countries.js.erb'
import DeleteButton from 'requests/DeleteButton';
import cn from 'classnames';
import _ from 'lodash';

const ResultForm = savableComponent(({
  id,
  roundId,
  originalResult,
  saveState,
}) => {
  const [savedResult, setSavedResult] = useState(originalResult);
  const [personData, setPersonData] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [errors, setErrors] = useState([]);
  const [infos, setInfos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [markerBest, setMarkerBest] = useState("");
  const [markerAvg, setMarkerAvg] = useState("");

  const eventId = originalResult.event_id;
  const solveCount = originalResult.format_id ?
    formats.byId[originalResult.format_id].expectedSolveCount : 0;

  useEffect(() => {
    setAttempts(
      times(solveCount, index =>
        (originalResult.attempts && originalResult.attempts[index]) || 0)
    );
    setPersonData({
      wca_id: originalResult.wca_id,
      person_name: originalResult.person_name,
      country_iso2: originalResult.country_iso2,
    });
    setMarkerBest(originalResult.regional_single_record || "");
    setMarkerAvg(originalResult.regional_average_record || "");
  }, [originalResult]);

  const hasChanges = () => {
    return !_.isEqual([
        // Original result always has 5 attempts
        trimTrailingZeros(savedResult.attempts),
        savedResult.regional_single_record,
        savedResult.regional_average_record,
        {
          wca_id: savedResult.wca_id,
          person_name: savedResult.person_name,
          country_iso2: savedResult.country_iso2,
        }
      ],
      [attempts, markerBest, markerAvg, personData]);
  };

  const toResult = () => {
    let res = {
      regionalSingleRecord: markerBest,
      regionalAverageRecord: markerAvg,
      best: best(attempts),
      average: average(attempts, eventId, solveCount),
      personName: personData.person_name,
      personId: personData.wca_id,
      countryId: countries.find(e => e.iso2 == personData.country_iso2).name,
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
        ...personData,
      });
      setInfos(response.infos);
    } else {
      setErrors(response.errors);
    }
  };
  return (
    <div className="row">
      <div className="col-xs-12 col-md-6">
        <RoundInfo id={roundId} originalResult={originalResult} />
        <PersonData
          loadedState={personData}
          updateData={setPersonData}
          savedResult={savedResult}
        />
      </div>
      <div className="col-xs-12 col-md-6">
        <div className="row">
          <AttemptList
            attempts={attempts}
            setAttempts={setAttempts}
            eventId={eventId}
            savedResult={savedResult}
            markerAvg={markerAvg}
            setMarkerAvg={setMarkerAvg}
            markerBest={markerBest}
            setMarkerBest={setMarkerBest}
            solveCount={solveCount}
          />
        </div>
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

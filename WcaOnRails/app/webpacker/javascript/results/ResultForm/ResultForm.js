import React, { useState, useEffect, useCallback } from 'react';

import { Button } from 'semantic-ui-react';

import _ from 'lodash';
import AttemptsForm from './AttemptsForm';
import PersonForm from './PersonForm';
import RoundForm from './RoundForm';
import SaveMessage from './SaveMessage';
import formats from '../../wca/formats.js.erb';
import useSaveData from '../../hooks/useSaveData';
import { average, best } from '../../wca-live/attempts';
import { resultUrl } from '../../requests/routes.js.erb';
import countries from '../../wca/countries.js.erb';
import './ResultForm.scss';

const roundDataFromResult = (result) => ({
  competitionId: result.competition_id || '',
  roundTypeId: result.round_type_id || '',
  formatId: result.format_id || '',
  eventId: result.event_id || '',
});

const attemptsDataFromResult = (solveCount, result) => ({
  attempts: _.times(solveCount, (index) => (result.attempts && result.attempts[index]) || 0),
  markerBest: result.regional_single_record || '',
  markerAvg: result.regional_average_record || '',
});

const personDataFromResult = (result) => ({
  wcaId: result.wca_id || '',
  name: result.name || '',
  countryIso2: result.country_iso2 || '',
});

const dataToResult = (round, person, attemptsData) => {
  const country = countries.byIso2[person.countryIso2];
  const res = {
    personId: person.wcaId,
    personName: person.name,
    countryId: country ? country.name : undefined,
    best: best(attemptsData.attempts),
    average: average(attemptsData.attempts, round.eventId, attemptsData.attempts.length),
    regionalAverageRecord: attemptsData.markerAvg,
    regionalSingleRecord: attemptsData.markerBest,
  };
  // Map individual attempts to valueN...
  attemptsData.attempts.forEach((a, index) => { res[`value${index + 1}`] = a; });
  // NOTE: we pass 'round' as a separate attribute because:
  //   - if we're editing a result, it's immutable (the result's id is enough
  //   to identify it!)
  //   - if we're creating a result, we want to let the backend take the
  //   requested round attribute, and figure out if the data are appropriate
  //   (ie: if it matches an existing round).
  return { result: res, round };
};

const ResultForm = ({
  result, saveAction, saving, response,
}) => {
  const solveCount = result.format_id
    ? formats.byId[result.format_id].expectedSolveCount : 0;
  const computeAverage = [3, 5].includes(solveCount) && result.event_id !== '333mbf';

  // Person-related state
  const [personData, setPersonData] = useState(personDataFromResult(result));

  // Immutable round-related data
  // FIXME: now that we have a 'Round' object for every round in the database
  // (I think), we may consider showing its data here, which would make it
  // slightly easier to select the appropriate round when creating a result,
  // if at some point we want to make it selectable.
  const [roundData, setRoundData] = useState(roundDataFromResult(result));

  // Attempts-related state
  const [attemptsState, setAttemptsState] = useState(attemptsDataFromResult(solveCount, result));

  // Populate the original states whenever the original result changes.
  useEffect(() => {
    setAttemptsState(attemptsDataFromResult(solveCount, result));
    setRoundData(roundDataFromResult(result));
    setPersonData(personDataFromResult(result));
  }, [result]);

  return (
    <div className="result-form">
      <h3>
        Round data
      </h3>
      <RoundForm roundData={roundData} />
      <h3>
        Person data
      </h3>
      <PersonForm personData={personData} setPersonData={setPersonData} />
      <h3>
        Attempts
      </h3>
      <AttemptsForm
        eventId={result.event_id}
        state={attemptsState}
        setState={setAttemptsState}
        computeAverage={computeAverage}
      />
      <SaveMessage response={response} />
      <Button
        positive
        loading={saving}
        disabled={saving}
        onClick={() => saveAction(dataToResult(roundData, personData, attemptsState))}
      >
        Save
      </Button>
    </div>
  );
};

// This is a simple wrapper to be able to manage request-specific states,
// and to be able to hide the form upon creation.
const ResultFormWrapper = ({ result, sync, AfterSaveElement }) => {
  const { id } = result;
  const newResult = id === undefined;

  // Saving and user-feedback states.
  const { save, saving } = useSaveData({ method: newResult ? 'POST' : 'PATCH' });
  const [response, setResponse] = useState({});
  // This is used to track if we did save something.
  const [saveSuccess, setSaveSuccess] = useState(false);

  const successAction = useCallback((data, responseJson) => {
    // Upon a successful request, set the response and the data sent.
    // Note that it doesn't mean something was written to the db, the response
    // may contain validation errors or information.
    setResponse({
      ...responseJson,
      sentResult: {
        ...data.result,
        ...data.round,
      },
    });
    if (response.errors === undefined) {
      sync();
      setSaveSuccess(true);
    }
  }, [setResponse, setSaveSuccess, sync]);

  const onError = useCallback((err) => {
    setResponse({
      errors: [
        'The request to the server failed. This is definitely unexpected, you may consider contacting the WST with the error below!',
        err.message,
      ],
    });
    setSaveSuccess(false);
  }, [setResponse, setSaveSuccess]);

  const saveAction = useCallback((data) => {
    const url = newResult ? resultUrl('') : resultUrl(id);
    const onSuccessAction = (responseJson) => successAction(data, responseJson);
    save(
      url,
      data,
      onSuccessAction,
      onError,
    );
  }, [save, newResult, successAction, onError]);

  return AfterSaveElement && saveSuccess ? (
    <AfterSaveElement response={response} />
  ) : (
    <ResultForm
      result={result}
      saveAction={saveAction}
      saving={saving}
      response={response}
    />
  );
};

export default ResultFormWrapper;

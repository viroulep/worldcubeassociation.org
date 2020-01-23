import React, { useEffect, useState } from 'react';
import { loadableComponent } from 'requests/loadable';
import { roundResourceUrl } from 'requests/routes.js.erb';
import events from 'wca/events.js.erb';
import formats from 'wca/formats.js.erb';
import roundTypes from 'wca/round-types.js.erb';

const roundNameFromIds = (eventId, roundTypeId) => {
  return `${events.byId[eventId].name} ${roundTypes.byId[roundTypeId].name}`;
};

const RoundInfo = loadableComponent(({
  id,
  originalResult,
  loadedState
}) => {
  return (
    <div>
      <p>
        <b>Round:</b>{' '}
        {loadedState ? (
          loadedState.name
        ) : (
          roundNameFromIds(originalResult.event_id, originalResult.round_type_id)
        )}
      </p>
      <p>
        <b>Format:</b>{' '}
        {loadedState ? (
          loadedState.format_name
        ) : (
          formats.byId[originalResult.format_id].name
        )}
      </p>
      {loadedState ? (
        <div>
          <p><b>Time limit:</b> {loadedState.time_limit}</p>
          <p><b>Cutoff:</b> {loadedState.cutoff === "" ? "None" : loadedState.cutoff}</p>
        </div>
      ) : (
        <div>
          <p>
            No additional information about the round (eg: cutoff, time limit) is available.
          </p>
        </div>
      )}
    </div>
  );
}, roundResourceUrl);

export default RoundInfo;

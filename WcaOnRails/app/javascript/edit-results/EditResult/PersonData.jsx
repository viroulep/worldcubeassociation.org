import React, { useEffect, useState } from 'react';
import { loadableComponent } from 'requests/loadable';
import { personResourceUrl } from 'requests/routes.js.erb';
import { updateIn } from 'wca/utils';
import events from 'wca/events.js.erb';
import formats from 'wca/formats.js.erb';
import countries from 'wca/countries.js.erb'
import roundTypes from 'wca/round-types.js.erb';

const PersonField = ({
  val,
  savedVal,
  label,
  onValue
}) =>
  <div>
    <label>{label}: (was: {savedVal})</label>
    <input
      type="text"
      className="form-control edit-result-attempt"
      value={val}
      onChange={event => onValue(event.target.value)}
    />
  </div>;

const CountryField = ({
  val,
  savedVal,
  label,
  onValue
}) =>
  <div>
    <label>{label}: (was: {countries.find(e => e.iso2 == savedVal).name})</label>
    <select
      className="form-control"
      value={val}
      onChange={event => onValue(event.target.value)}
    >
      {countries.map(country => (
        <option key={country.iso2} value={country.iso2}>
          {country.name}
        </option>
      ))}
    </select>
  </div>;

// NOTE: currently, we don't actually use it as a loadable component
const PersonData = loadableComponent(({
  id,
  loadedState,
  savedResult,
  updateData,
}) => {

  const updateNestedData = (id, value) =>
    updateData(updateIn(loadedState, [id], () => value));

  return (
    <div>
      {loadedState ? (
        <div>
          <PersonField label="WCA ID"
            savedVal={savedResult.wca_id}
            val={loadedState.wca_id}
            onValue={v => updateNestedData("wca_id", v)}
          />
          <PersonField label="Name"
            savedVal={savedResult.person_name}
            val={loadedState.person_name}
            onValue={v => updateNestedData("person_name", v)}
          />
          <CountryField label="Country"
            savedVal={savedResult.country_iso2}
            val={loadedState.country_iso2}
            onValue={v => updateNestedData("country_iso2", v)}
          />
        </div>
      ) : (
        <div>
          Not loaded
        </div>
      )}
    </div>
  );
}, personResourceUrl);

export default PersonData;

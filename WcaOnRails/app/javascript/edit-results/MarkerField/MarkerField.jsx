import React, { useState } from 'react';
import allMarkers from 'wca/regionalMarkers.js.erb';

const MarkerField = ({ onChange, marker }) => {
  return (
    <select onChange={ (ev) => onChange(ev.target.value) } value={marker} className="form-control" style={{width: "auto", display: "inline"}}>
      {allMarkers.map(val => {
        return <option value={val} key={val}>{val}</option>;
      })}
    </select>
  );
};

export default MarkerField;

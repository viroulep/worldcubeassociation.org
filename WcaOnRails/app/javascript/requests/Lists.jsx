import React from 'react';

const List = ({ items, style }) => {
  return (
    <div className={`alert alert-${style}`} role="alert">
      See the following information:
      <ul>
        {items.map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    </div>
  );
};

export const ErrorList = props => <List {...props} style="danger" />;
export const InfoList = props => <List {...props} style="info" />;

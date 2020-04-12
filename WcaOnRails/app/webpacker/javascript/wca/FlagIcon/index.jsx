import React from 'react';

const FlagIcon = ({
  iso2,
}) => <span className={`flag-icon flag-icon-${iso2.toLowerCase()}`} />;

export default FlagIcon;

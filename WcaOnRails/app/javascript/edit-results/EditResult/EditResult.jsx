import React, { useEffect, useState } from 'react';
import ResultForm from './ResultForm'

import { resultResourceUrl } from 'requests/routes.js.erb';
import { loadableComponent } from 'requests/loadable';

const EditResult = loadableComponent(({
  id,
  roundId,
  loadedState
}) => {
  return (
    <div className="row">
      { loadedState ? (
        <div className="col-xs-12">
          <ResultForm
            id={id}
            roundId={roundId}
            originalResult={loadedState}
          />
        </div>
      ) : (
        <div>Not loaded yet</div>
      )}
    </div>
  );
}, resultResourceUrl);

export default EditResult;

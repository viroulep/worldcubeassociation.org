import React, { useEffect, useState } from 'react';
import ResultForm from './ResultForm'
import RoundInfo from './RoundInfo'

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
        <div>
          <div className="col-xs-12">
            <RoundInfo
              id={roundId}
              originalResult={loadedState}
            />
          </div>
          <div className="col-xs-12 col-md-6">
            <ResultForm
              id={id}
              originalResult={loadedState}
            />
          </div>
        </div>
      ) : (
        <div>Not loaded yet</div>
      )}
    </div>
  );
}, resultResourceUrl);

export default EditResult;

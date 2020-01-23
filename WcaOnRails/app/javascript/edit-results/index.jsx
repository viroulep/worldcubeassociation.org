import React from 'react'
import ReactDOM from 'react-dom'
import EditResult from './EditResult/EditResult'

wca.initializeResultForm = (id, roundId, defaultAttributes = null) => {
  ReactDOM.render(
    <EditResult
      id={id}
      roundId={roundId}
      loadedState={defaultAttributes}
    />,
    document.getElementById('result-edit-area'),
  )
}

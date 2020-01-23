import React, { useEffect, useState } from 'react';
import { fetchJsonOrError } from './fetchWithAuthenticityToken';

// This is a HOC that can be used to save a data to the website (as json)
// It assumes that:
//   - urlHelper is a function which takes one parameter: an identifier of the
//   resource to set.
//   - 'id' is passed in the props, and will be fed to the urlHelper.
//   For new record, 'id' may be null, urlHelper is responsible for returning
//   the appropriate url.
//   - 'saveState' is pass down to the wrapped component, and can be used to
//   save the value (one param: data).
//   - 'saveErrors' is pass down to the wrapped component if any error arised.
// Example of usage:
// const ModelComponent = savableComponent(id => { /* component stuff */ }, id => `path/to/resource/${id}` || `path/to/new/resource`;);
export const savableComponent = (WrappedComponent, urlHelper) => {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        response: {},
      };
    }

    saveState = (data, onSuccess) => {
      fetchJsonOrError(urlHelper(this.props.id), {
        headers: {
          "Content-Type": "application/json",
        },
        //credentials: 'include',
        method: "PATCH",
        body: JSON.stringify(data),
      }).then(response => {
        this.setState({ response });
        onSuccess(response);
      });
    };

    render() {
      return <WrappedComponent saveState={this.saveState} {...this.props} />;
    }
  };
};

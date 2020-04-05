import React from 'react';
import { fetchJsonOrError } from './fetchWithAuthenticityToken';

// This is a HOC that can be used to get a data from the website (as json)
// It assumes that:
//   - urlHelper is a function which takes one parameter: an identifier of the
//   resource to get.
//   - 'id' is passed in the props, and is an identifier of the resource
//   (passed to the urlHelper).
//   - 'loadedState' is pass down to the wrapped component.
// Example of usage:
// const ModelComponent = loadableComponent(WrappedComponent, id => `path/to/resource/${id}`);
export default (WrappedComponent, urlHelper) => class extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: props.loadedState,
      error: null,
    };
    this.loadState = this.loadState.bind(this);
  }

  componentDidMount() {
    this.loadState();
  }

  componentDidUpdate(prevProps) {
    const { id } = this.props;
    if (id !== prevProps.id) {
      this.loadState();
    }
  }

  componentWillUnmount() {
    this.loadState();
  }

  loadState() {
    const { id, loadedState } = this.props;
    if (id) {
      fetchJsonOrError(urlHelper(id))
        .then((fetchedState) => {
          this.setState({ loaded: fetchedState, error: null });
        })
        .catch((error) => {
          this.setState({ loaded: loadedState, error });
        });
    }
  }

  render() {
    const { loaded, error } = this.state;
    const { loadedState } = this.props;
    // FIXME: not sure if this component should be responsible for displaying
    // loading/errored. Maybe it's best to let the wrapped component handle it
    // as it sees fit.
    return (
      <WrappedComponent
        /* eslint-disable-next-line */
        {...this.props}
        loadedState={loaded || loadedState}
        error={error}
      />
    );
  }
};

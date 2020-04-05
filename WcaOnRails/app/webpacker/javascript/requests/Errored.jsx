import React from 'react';

import Message from 'semantic/collections/Message';
import 'semantic-css/message';
import Icon from 'semantic/elements/Icon';
import 'semantic-css/icon';

const Errored = ({
  componentName,
}) => (
  <Message icon negative>
    <Icon name="warning sign" />
    <Message.Content>
      <Message.Header>Oh no :(</Message.Header>
      Something went wrong while loading the data
      {componentName && (
      <>
        {' '}
        for the component &apos;
        {componentName}
        &apos;
      </>
      )}
      !
    </Message.Content>
  </Message>
);

export default Errored;

import React from 'react';

import Placeholder from 'semantic/elements/Placeholder';
import 'semantic-css/placeholder';
import './Loading.scss';

const Loading = () => (
  <Placeholder>
    <Placeholder.Paragraph>
      <Placeholder.Line />
      <Placeholder.Line />
      <Placeholder.Line />
      <Placeholder.Line />
    </Placeholder.Paragraph>
  </Placeholder>
);

export default Loading;

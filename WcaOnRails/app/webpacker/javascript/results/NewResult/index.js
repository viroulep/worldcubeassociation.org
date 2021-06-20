import React from 'react';

import { registerComponent } from '../../wca/react-utils';
import ResultForm from '../ResultForm/ResultForm';
import AfterCreateMessage from './AfterCreateMessage';

const NewResult = ({
  result,
}) => (
  <>
    <h3>Creating a new result</h3>
    <ResultForm result={result} sync={() => {}} AfterSaveElement={AfterCreateMessage} />
  </>
);

registerComponent(NewResult, 'NewResult');

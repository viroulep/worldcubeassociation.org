import React, { useState } from 'react';

import { registerComponent } from '../../wca/react-utils';
import OmnisearchInput from '../../search_widget/OmnisearchInput';
import { userSearchApiUrl } from '../../requests/routes.js.erb';

// TODO: create some generic forminput from which many could inherit.
const UserIdsInput = ({ multiple, inputName, inputId }) => {
  const [value, setValue] = useState('');
  const onSelect = (selected) => {
    setValue(selected.map(({ id }) => id).join());
  };
  return (
    <>
      <input type="hidden" id={inputId} name={inputName} value={value} />
      <OmnisearchInput
        removeNoResultsMessage
        multiple={multiple}
        url={userSearchApiUrl}
        onSelect={onSelect}
      />
    </>
  );
};

registerComponent(UserIdsInput, 'UserIdsInput');
export default UserIdsInput;

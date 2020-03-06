import React, { useState } from 'react';

import { dnfKeys, dnsKeys } from '../keybindings';
import TimeField from '../TimeField/TimeField';
import CubesField from '../CubesField/CubesField';
import {
  decodeMbldAttempt,
  encodeMbldAttempt,
  validateMbldAttempt,
  formatAttemptResult,
} from '../../../wca/attempts';

const MbldField = ({ initialValue, onValue, disabled, label, savedValue }) => {
  const [prevInitialValue, setPrevInitialValue] = useState(null);
  const [decodedValue, setDecodedValue] = useState(
    decodeMbldAttempt(initialValue)
  );

  /* Sync local value when initial value changes. See AttemptField for detailed description. */
  if (prevInitialValue !== initialValue) {
    setDecodedValue(decodeMbldAttempt(initialValue));
    setPrevInitialValue(initialValue);
  }

  const handleDecodedValueChange = decodedValue => {
    const updatedDecodedValue = validateMbldAttempt(decodedValue);
    if (encodeMbldAttempt(updatedDecodedValue) !== initialValue) {
      onValue(encodeMbldAttempt(updatedDecodedValue));
      /* Once we emit the change, reflect the initial state. */
      setDecodedValue(decodeMbldAttempt(initialValue));
    } else {
      setDecodedValue(updatedDecodedValue);
    }
  };

  const handleAnyKeyPress = event => {
    if (dnfKeys.includes(event.key)) {
      handleDecodedValueChange(decodeMbldAttempt(-1));
      event.preventDefault();
    } else if (dnsKeys.includes(event.key)) {
      handleDecodedValueChange(decodeMbldAttempt(-2));
      event.preventDefault();
    }
  };
  return (
    <div className="row" onKeyPress={handleAnyKeyPress}>
      <div className="col-xs-12">
        <label>{label} (was: {formatAttemptResult(savedValue, "333mbf")})</label>
      </div>
      <div className="col-xs-2">
        <CubesField
          initialValue={decodedValue.solved}
          onValue={solved =>
            handleDecodedValueChange({ ...decodedValue, solved })
          }
          disabled={disabled}
        />
      </div>
      <div className="col-xs-2">
        <CubesField
          initialValue={decodedValue.attempted}
          onValue={attempted =>
            handleDecodedValueChange({ ...decodedValue, attempted })
          }
          disabled={disabled}
        />
      </div>
      <div className="col-xs-8">
        <TimeField
          initialValue={decodedValue.centiseconds}
          onValue={centiseconds =>
            handleDecodedValueChange({ ...decodedValue, centiseconds })
          }
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default MbldField;

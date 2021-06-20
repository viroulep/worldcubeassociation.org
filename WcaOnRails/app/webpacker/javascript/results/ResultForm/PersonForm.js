import React from 'react';
import { Form, Grid } from 'semantic-ui-react';

import CountrySelector from '../../inputs/CountrySelector/CountrySelector';

const PersonForm = ({ personData, setPersonData }) => {
  const { wcaId, name, countryIso2 } = personData;
  return (
    <Form>
      <Grid stackable padded columns={3}>
        <Grid.Column>
          <Form.Input
            label="WCA ID"
            onChange={(ev, { value }) => setPersonData((prev) => ({
              ...prev,
              wcaId: value,
            }))}
            value={wcaId}
          />
        </Grid.Column>
        <Grid.Column>
          <Form.Input
            label="Name"
            onChange={(ev, { value }) => setPersonData((prev) => ({
              ...prev,
              name: value,
            }))}
            value={name}
          />
        </Grid.Column>
        <Grid.Column>
          <CountrySelector
            countryIso2={countryIso2}
            onChange={(ev, { value }) => setPersonData((prev) => ({
              ...prev,
              countryIso2: value,
            }))}
          />
        </Grid.Column>
      </Grid>
    </Form>
  );
};

export default PersonForm;

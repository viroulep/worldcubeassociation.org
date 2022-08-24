import React, { useState } from 'react';

import {
  Icon, Form, Pagination, Radio, Table,
} from 'semantic-ui-react';
import useLoadedData from '../lib/hooks/useLoadedData';
import { personCompetitionsUrl } from '../lib/requests/routes.js.erb';
import Loading from './Requests/Loading';
import Errored from './Requests/Errored';
import CountryFlag from './wca/CountryFlag';
import useInputState from '../lib/hooks/useInputState';

function CompetitionsBody({ competitions }) {
  // FIXME: if empty!
  // FIXME: move this component elsewhere, and provide the appropriate path from
  // the render thingy.
  return (
    <>
      {competitions.map((c) => (
        <Table.Row key={c.id}>
          <Table.Cell>{c.name}</Table.Cell>
          <Table.Cell><CountryFlag iso2={c.country_iso2} /></Table.Cell>
          <Table.Cell>{c.organizers.map(({ name }) => name).join(', ')}</Table.Cell>
          <Table.Cell>{c.delegates.map(({ name }) => name).join(', ')}</Table.Cell>
          <Table.Cell>{c.trainee_delegates.map(({ name }) => name).join(', ')}</Table.Cell>
        </Table.Row>
      ))}
    </>
  );
}

function Inputs({
  source, setSource, totalCompetitor, totalOrganizer, totalDelegate, totalTrainee,
}) {
  // Using 'label' instead of Form.Field triggers an eslint error that a label
  // must be attached to an input.
  return (
    <Form>
      <Form.Group inline>
        <Form.Field
          label="Competitions as a:"
        />
        <Form.Field
          control={Radio}
          value="competitor"
          checked={source === 'competitor'}
          label={`Competitor (${totalCompetitor})`}
          onChange={setSource}
        />
        <Form.Field
          control={Radio}
          value="delegate"
          checked={source === 'delegate'}
          label={`Delegate (${totalDelegate})`}
          onChange={setSource}
        />
        <Form.Field
          control={Radio}
          value="trainee"
          checked={source === 'trainee'}
          label={`Trainee Delegate (${totalTrainee})`}
          onChange={setSource}
        />
        <Form.Field
          control={Radio}
          value="organizer"
          checked={source === 'organizer'}
          label={`Organizer (${totalOrganizer})`}
          onChange={setSource}
        />
      </Form.Group>
    </Form>
  );
}

function CompetitionsPagination({
  page, setPage, totalPages,
}) {
  return (
    <Pagination
      activePage={page}
      onPageChange={(e, { activePage }) => setPage(activePage)}
      totalPages={totalPages}
      boundaryRange={0}
      siblingRange={2}
      ellipsisItem={null}
      firstItem={{ content: <Icon name="angle double left" />, icon: true }}
      lastItem={{ content: <Icon name="angle double right" />, icon: true }}
      prevItem={{ content: <Icon name="angle left" />, icon: true }}
      nextItem={{ content: <Icon name="angle right" />, icon: true }}
    />
  );
}

function CompetitionsLoader({
  wcaId, source, setSource, page, setPage,
}) {
  const { data, loading, error } = useLoadedData(personCompetitionsUrl(wcaId, source, page));
  return (
    <>
      <Inputs
        source={source}
        setSource={setSource}
        totalCompetitor={data ? data.totalCompetitor : 0}
        totalDelegate={data ? data.totalDelegate : 0}
        totalTrainee={data ? data.totalTrainee : 0}
        totalOrganizer={data ? data.totalOrganizer : 0}
      />
      {data && (
        <CompetitionsPagination page={page} setPage={setPage} totalPages={data.totalPages} />
      )}
      <Table striped celled padded>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell width={3}>Name</Table.HeaderCell>
            <Table.HeaderCell width={1}>Country</Table.HeaderCell>
            <Table.HeaderCell width={4}>Organizers</Table.HeaderCell>
            <Table.HeaderCell width={4}>Delegates</Table.HeaderCell>
            <Table.HeaderCell width={4}>Trainee Delegates</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {error && (
          <Table.Row>
            <Table.Cell colSpan={5}>
              <Errored componentName="ShowCompetitions" />
            </Table.Cell>
          </Table.Row>
          )}
          {loading && (
          <Table.Row>
            <Table.Cell colSpan={5}>
              <Loading />
            </Table.Cell>
          </Table.Row>
          )}
          {!loading && data && (
          <CompetitionsBody competitions={data.competitions} />
          )}
        </Table.Body>
      </Table>
      {data && (
        <CompetitionsPagination page={page} setPage={setPage} totalPages={data.totalPages} />
      )}
    </>
  );
}

function ShowCompetitions({
  wcaId,
}) {
  const [source, setSource] = useInputState('competitor');
  // FIXME: reset page to one wuen source change
  const [page, setPage] = useState(1);
  return (
    <CompetitionsLoader
      source={source}
      setSource={setSource}
      wcaId={wcaId}
      page={page}
      setPage={setPage}
    />
  );
}

export default ShowCompetitions;

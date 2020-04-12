import React, { useState } from 'react';

import Dropdown from 'semantic/modules/Dropdown';
import 'semantic-css/dropdown';
import 'semantic-css/transition';
import 'semantic-css/label';
import Image from 'semantic/elements/Image';
import 'semantic-css/image';
import './index.scss';

import { omnisearchApiUrl } from '../requests/routes.js.erb';
import { registerComponent } from '../wca/react-utils';
import { useDebouncedSearch } from '../requests/fetchWithAuthenticityToken';
import FlagIcon from '../wca/FlagIcon';

const UserItem = ({
  user,
}) => (
  <>
    <Image src={user.avatar.thumb_url} />
    <div className="details-user">
      <span>{user.name}</span>
      {user.wca_id && (
        <span className="wca-id">{user.wca_id}</span>
      )}
    </div>
  </>
);

const CompetitionItem = ({
  comp,
}) => (
  <>
    <div className="details-comp">
      <div>{comp.name}</div>
      <div className="extra-details">
        <FlagIcon iso2={comp.country_iso2} />
        {comp.city}
        {' '}
        (
        {comp.id}
        )
      </div>
    </div>
  </>
);

const RegulationItem = ({
  reg,
}) => (
  <>
    <div className="details-reg">
      <div className="reg-id">
        {reg.id}
        :
      </div>
      {/* eslint-disable-next-line react/no-danger */}
      <div className="reg-text" dangerouslySetInnerHTML={{ __html: reg.content_html }} />
    </div>
  </>
);

const ItemFor = ({
  item,
}) => (
  <div className="selected-item">
    {(item.class === 'user' || item.class === 'person') && (
      <UserItem user={item} />
    )}
    {item.class === 'competition' && (
      <CompetitionItem comp={item} />
    )}
    {item.class === 'regulation' && (
      <RegulationItem reg={item} />
    )}
  </div>
);

const renderLabel = ({ item }) => ({
  color: 'blue',
  content: <ItemFor item={item} />,
  className: 'omnisearch-item',
  as: 'div',
});

const itemToOption = (item) => {
  const { id, name } = item;
  return {
    item,
    id,
    key: id,
    value: id,
    // 'text' is used by the search method from the component, we need to put
    // the text with a potential match here!
    text: [id, name, item.content_html].join(' '),
    content: <ItemFor item={item} />,
  };
};

const DropdownWithFetch = () => {
  const [selected, setSelected] = useState([]);
  const { inputText, setInputText, searchObject } = useDebouncedSearch(omnisearchApiUrl);
  const { loading, result } = searchObject;

  const handleSearchChange = (e, { searchQuery }) => setInputText(searchQuery);

  const handleChange = (e, { value, options }) => {
    const done = [];
    setSelected(selected.concat(options).filter((item) => {
      const { id } = item;
      if (!done.includes(id) && value.includes(id)) {
        done.push(id);
        return true;
      }
      return false;
    }));
  };

  const value = selected.map(({ id }) => id);

  const newOptions = [
    ...selected,
  ];

  if (result) {
    // Our search API wraps the results within a "result" attribute.
    result.result
      // We want to extend the options only with unselected results!
      .filter(({ id }) => !value.includes(id))
      .forEach((item) => newOptions.push(itemToOption(item)));
  }


  return (
    <Dropdown
      fluid
      selection
      multiple
      search
      value={value}
      searchQuery={inputText}
      options={newOptions}
      onChange={handleChange}
      onSearchChange={handleSearchChange}
      loading={loading}
      placeholder="Choose an option"
      renderLabel={renderLabel}
    />
  );
};

const SearchWidget = () => (
  <>
    <DropdownWithFetch />
  </>
);

registerComponent(SearchWidget, 'SearchWidget');

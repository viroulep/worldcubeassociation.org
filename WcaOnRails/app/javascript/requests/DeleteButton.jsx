import React from 'react';

// Return a delete link based on rails ujs
const DeleteButton = ({ url }) =>
  <a
    href={url}
    className="btn btn-danger"
    data-method="delete"
    data-confirm="Are you sure you want to delete this record?"
  >
    Delete
  </a>;

export default DeleteButton;

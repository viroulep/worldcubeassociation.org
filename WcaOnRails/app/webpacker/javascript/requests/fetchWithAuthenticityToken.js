import AwesomeDebouncePromise from 'awesome-debounce-promise';
import { useAsync } from 'react-async-hook';
import { useState } from 'react';
import useConstant from 'use-constant';

export function fetchWithAuthenticityToken(url, fetchOptions) {
  const options = fetchOptions || {};
  if (!options.headers) {
    options.headers = {};
  }
  const csrfTokenElement = document.querySelector('meta[name=csrf-token]');
  if (csrfTokenElement) {
    options.headers['X-CSRF-Token'] = csrfTokenElement.content;
  }
  return fetch(url, options);
}

export function fetchJsonOrError(url, fetchOptions = {}) {
  return fetchWithAuthenticityToken(url, fetchOptions)
    .then((response) => response.json()
      .then((json) => {
        if (!response.ok) {
          throw new Error(`${response.status}: ${response.statusText}\n${json.error}`);
        }
        return json;
      }));
}

export const useDebouncedSearch = (url, fetchOptions = {}) => {
  const [inputText, setInputText] = useState('');
  const fetchFunction = (query) => fetchJsonOrError(url(query), fetchOptions);
  const debouncedSearch = useConstant(() => AwesomeDebouncePromise(fetchFunction, 300));
  const searchObject = useAsync((text) => {
    if (text.length < 3) {
      return { result: [] };
    }
    return debouncedSearch(text);
  }, [inputText]);

  return {
    inputText,
    setInputText,
    searchObject,
  };
};

function getAuthenticityToken() {
  return document.querySelector('meta[name=csrf-token]').content;
}

export function fetchWithAuthenticityToken(url, fetchOptions) {
  const options = fetchOptions || {};
  if (!options.headers) {
    options.headers = {};
  }
  options.headers['X-CSRF-Token'] = getAuthenticityToken();
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

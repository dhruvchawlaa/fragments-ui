const apiUrl = process.env.API_URL || 'http://localhost:8080';

export async function getUserFragments(user, expand = false) {
  console.log('Requesting user fragments data...');
  try {
    const url = new URL(`${apiUrl}/v1/fragments`);
    if (expand) {
      url.searchParams.append('expand', '1');
    }
    const res = await fetch(url.toString(), {
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log('Successfully got user fragments data', { data });
    return data;
  } catch (err) {
    console.error('Unable to call GET /v1/fragments', { err });
  }
}

export async function createFragment(user, fragmentContent, contentType) {
  try {
    const res = await fetch(`${apiUrl}/v1/fragments`, {
      method: 'POST',
      headers: {
        ...user.authorizationHeaders(),
        'Content-Type': contentType,
      },
      body: fragmentContent,
    });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log('Fragment created successfully', data);
    return data;
  } catch (err) {
    console.error('Error creating fragment', { err });
  }
}

export async function getFragmentContent(user, fragmentId) {
  console.log(`Requesting fragment data for ID: ${fragmentId}`);
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${fragmentId}`, {
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const contentType = res.headers.get('Content-Type');
    if (contentType.startsWith('image/')) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      return { url, contentType };
    } else {
      const text = await res.text();
      return { text, contentType };
    }
  } catch (err) {
    console.error(`Unable to call GET /v1/fragments/${fragmentId}`, { err });
  }
}

export async function getFragmentInfo(user, fragmentId) {
  console.log(`Requesting fragment info for ID: ${fragmentId}`);
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${fragmentId}/info`, {
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log('Successfully got fragment info', { data });
    return data;
  } catch (err) {
    console.error(`Unable to call GET /v1/fragments/${fragmentId}/info`, { err });
  }
}

export async function convertFragment(user, fragmentId, toHtml = true) {
  console.log(`Converting fragment to ${toHtml ? 'HTML' : 'Markdown'} for ID: ${fragmentId}`);
  try {
    const url = `${apiUrl}/v1/fragments/${fragmentId}.${toHtml ? 'html' : 'md'}`;
    const res = await fetch(url, {
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const data = await res.text();
    console.log(`Successfully converted fragment to ${toHtml ? 'HTML' : 'Markdown'}`, { data });
    return data;
  } catch (err) {
    console.error(`Unable to convert fragment for ID ${fragmentId}`, { err });
  }
}

export async function updateFragment(user, fragmentId, newContent, contentType) {
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${fragmentId}`, {
      method: 'PUT',
      headers: {
        ...user.authorizationHeaders(),
        'Content-Type': contentType,
      },
      body: newContent,
    });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log('Fragment updated successfully', data);
    return data;
  } catch (err) {
    console.error('Error updating fragment', { err });
  }
}

export async function deleteFragment(user, fragmentId) {
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${fragmentId}`, {
      method: 'DELETE',
      headers: user.authorizationHeaders(),
    });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    console.log('Fragment deleted successfully');
    return true;
  } catch (err) {
    console.error('Error deleting fragment', { err });
  }
}

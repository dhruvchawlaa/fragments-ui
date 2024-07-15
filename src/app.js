import { Auth, getUser } from './auth';
import { getUserFragments, createFragment, getFragmentContent, convertFragment } from './api';

async function init() {
  const userSection = document.querySelector('#user');
  const loginBtn = document.querySelector('#login');
  const logoutBtn = document.querySelector('#logout');
  const fragmentForm = document.querySelector('#fragment-form');
  const fragmentText = document.querySelector('#fragment-text');
  const fragmentType = document.querySelector('#fragment-type');
  const fragmentList = document.querySelector('#fragment-list');
  const dropArea = document.querySelector('#drop-area');

  loginBtn.onclick = () => {
    Auth.federatedSignIn();
  };
  logoutBtn.onclick = () => {
    Auth.signOut();
  };

  const user = await getUser();
  if (!user) {
    logoutBtn.disabled = true;
    return;
  }

  userSection.hidden = false;
  userSection.querySelector('.username').innerText = user.username;
  loginBtn.disabled = true;

  displayUserFragments(user);

  fragmentForm.onsubmit = async (event) => {
    event.preventDefault();
    if (fragmentText.value) {
      const contentType = fragmentType.value;
      try {
        const newFragment = await createFragment(user, fragmentText.value, contentType);
        console.log('New Fragment:', newFragment);
        fragmentText.value = '';
        displayUserFragments(user);
      } catch (err) {
        console.error('Failed to create fragment', { err });
      }
    }
  };

  dropArea.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropArea.classList.add('dragging');
  });

  dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('dragging');
  });

  dropArea.addEventListener('drop', async (event) => {
    event.preventDefault();
    dropArea.classList.remove('dragging');

    const files = event.dataTransfer.files;
    if (files.length) {
      const file = files[0];
      const contentType = getContentType(file.name);
      if (!contentType) {
        console.error('Unsupported file type');
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const newFragment = await createFragment(user, reader.result, contentType);
          console.log('New Fragment:', newFragment);
          displayUserFragments(user);
        } catch (err) {
          console.error('Error creating fragment', { err });
        }
      };

      reader.readAsText(file);
    }
  });
}

function getContentType(fileName) {
  const extension = fileName.split('.').pop().toLowerCase();
  switch (extension) {
    case 'txt':
      return 'text/plain';
    case 'md':
      return 'text/markdown';
    case 'html':
      return 'text/html';
    case 'csv':
      return 'text/csv';
    case 'json':
      return 'application/json';
    case 'yaml':
    case 'yml':
      return 'application/yaml';
    default:
      return null;
  }
}

async function displayUserFragments(user) {
  const userFragments = await getUserFragments(user, true);
  console.log(userFragments.fragments);

  if (userFragments.fragments) {
    const fragmentList = document.querySelector('#fragment-list');

    fragmentList.innerHTML = '';

    for (const fragment of userFragments.fragments) {
      const li = document.createElement('li');
      const content = await getFragmentContent(user, fragment.id);
      li.innerHTML = `
        <div class="fragment-content">${escapeHTML(content)}</div>
        <div class="fragment-metadata" style="display: none;">
          <p><strong>Id:</strong> ${fragment.id}</p>
          <p><strong>Owner Id:</strong> ${fragment.ownerId}</p>
          <p><strong>Type:</strong> ${fragment.type}</p>
          <p><strong>Size:</strong> ${fragment.size} bytes</p>
          <p><strong>Created:</strong> ${new Date(fragment.created).toLocaleString()}</p>
          <p><strong>Updated:</strong> ${new Date(fragment.updated).toLocaleString()}</p>
          ${fragment.type === 'text/markdown' ? `<button class="convert-btn" data-id="${fragment.id}" data-tohtml="true">Convert to HTML</button>` : ''}
        </div>
      `;
      li.querySelector('.fragment-content').onclick = () => {
        const metadata = li.querySelector('.fragment-metadata');
        metadata.style.display = metadata.style.display === 'none' ? 'block' : 'none';
      };

      if (fragment.type === 'text/markdown') {
        li.querySelector('.convert-btn').onclick = async (event) => {
          const button = event.target;
          const fragmentId = button.getAttribute('data-id');
          const toHtml = button.getAttribute('data-tohtml') === 'true';
          const newContent = await convertFragment(user, fragmentId, toHtml);
          button.innerText = toHtml ? 'Convert to Markdown' : 'Convert to HTML';
          button.setAttribute('data-tohtml', !toHtml);
          li.querySelector('.fragment-content').innerHTML = toHtml
            ? newContent
            : escapeHTML(newContent);
        };
      }

      fragmentList.appendChild(li);
    }
  } else {
    console.error('Fragments array is not available or is not an array.');
  }
}

function escapeHTML(html) {
  const div = document.createElement('div');
  div.innerText = html;
  return div.innerHTML;
}

addEventListener('DOMContentLoaded', init);

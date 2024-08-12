import { Auth, getUser } from './auth';
import {
  getUserFragments,
  createFragment,
  getFragmentContent,
  convertFragment,
  updateFragment,
  deleteFragment,
} from './api';

async function init() {
  const userSection = document.querySelector('#user');
  const loginBtn = document.querySelector('#login');
  const logoutBtn = document.querySelector('#logout');
  const fragmentForm = document.querySelector('#fragment-form');
  const fragmentText = document.querySelector('#fragment-text');
  const fragmentType = document.querySelector('#fragment-type');
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

      if (contentType.startsWith('image/')) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
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
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'avif':
      return 'image/avif';
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
      const { url, text, contentType } = await getFragmentContent(user, fragment.id);

      let fragmentContent;
      if (contentType && contentType.startsWith('image/')) {
        fragmentContent = `<img src="${url}" alt="Image Fragment" />`;
      } else if (text) {
        fragmentContent = escapeHTML(text);
      } else {
        fragmentContent = '<em>Unable to display content</em>';
      }

      li.innerHTML = `
        <div class="fragment-content">${fragmentContent}</div>
        <div class="fragment-metadata" style="display: none;">
          <p><strong>Id:</strong> ${fragment.id}</p>
          <p><strong>Owner Id:</strong> ${fragment.ownerId}</p>
          <p><strong>Type:</strong> ${fragment.type}</p>
          <p><strong>Size:</strong> ${fragment.size} bytes</p>
          <p><strong>Created:</strong> ${new Date(fragment.created).toLocaleString()}</p>
          <p><strong>Updated:</strong> ${new Date(fragment.updated).toLocaleString()}</p>
          ${generateConversionButtons(fragment)}
          <button class="update-btn" data-id="${fragment.id}">Update</button>
          <button class="delete-btn" data-id="${fragment.id}">Delete</button>
        </div>
      `;

      li.querySelector('.fragment-content').onclick = () => {
        const metadata = li.querySelector('.fragment-metadata');
        metadata.style.display = metadata.style.display === 'none' ? 'block' : 'none';
      };

      li.querySelectorAll('.view-btn').forEach((button) => {
        let originalContentStored = false;
        let originalContent = '';

        button.onclick = async (event) => {
          const button = event.target;
          const fragmentId = button.getAttribute('data-id');
          const extension = button.getAttribute('data-extension');
          const contentArea = li.querySelector('.fragment-content');
          const allViewButtons = li.querySelectorAll('.view-btn');

          if (!originalContentStored) {
            originalContent = contentArea.querySelector('img')?.src || contentArea.innerHTML;
            originalContentStored = true;
          }

          if (contentType.startsWith('image/')) {
            if (button.innerText.includes('View')) {
              allViewButtons.forEach((btn) => {
                if (btn !== button) btn.disabled = true;
              });

              const newContent = await convertFragment(user, fragmentId, extension);
              if (newContent && newContent.url) {
                const img = document.createElement('img');
                img.src = newContent.url;
                img.alt = `Image Fragment in ${extension}`;
                img.classList.add('viewed-image');
                contentArea.innerHTML = '';
                contentArea.appendChild(img);
                button.innerText = `Convert to .${fragment.type.split('/')[1]}`;
              } else {
                console.error('View returned undefined content');
                allViewButtons.forEach((btn) => (btn.disabled = false));
              }
            } else {
              contentArea.innerHTML = `<img src="${originalContent}" alt="Image Fragment in ${fragment.type.split('/')[1]}" class="viewed-image" />`;
              button.innerText = `View as .${extension}`;
              allViewButtons.forEach((btn) => (btn.disabled = false));
            }
          } else {
            if (button.innerText.includes('View')) {
              allViewButtons.forEach((btn) => {
                if (btn !== button) btn.disabled = true;
              });

              const newContent = await convertFragment(user, fragmentId, extension);
              if (newContent && newContent.text) {
                contentArea.innerHTML = escapeHTML(newContent.text);
                button.innerText = `Convert to .${fragment.type.split('/')[1]}`;
              } else {
                console.error('Conversion returned undefined content');
                allViewButtons.forEach((btn) => (btn.disabled = false));
              }
            } else {
              contentArea.innerHTML = originalContent;
              button.innerText = `View as .${extension}`;
              allViewButtons.forEach((btn) => (btn.disabled = false));
            }
          }
        };
      });

      li.querySelectorAll('.download-btn').forEach((button) => {
        button.onclick = async (event) => {
          const button = event.target;
          const fragmentId = button.getAttribute('data-id');
          const extension = button.getAttribute('data-extension');

          const newContent = await convertFragment(user, fragmentId, extension);
          if (newContent && newContent.url) {
            const a = document.createElement('a');
            a.href = newContent.url;
            a.download = `${fragmentId}.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          } else if (newContent.text) {
            const blob = new Blob([newContent.text], { type: newContent.contentType });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fragmentId}.${extension}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          } else {
            console.error('Download returned undefined content');
          }
        };
      });

      li.querySelector('.update-btn').onclick = async () => {
        const newContent = prompt('Enter new content for the fragment:', fragmentContent);
        if (newContent !== null) {
          try {
            await updateFragment(user, fragment.id, newContent, fragment.type);
            displayUserFragments(user);
          } catch (err) {
            console.error('Failed to update fragment', { err });
          }
        }
      };

      li.querySelector('.delete-btn').onclick = async () => {
        if (confirm('Are you sure you want to delete this fragment?')) {
          try {
            await deleteFragment(user, fragment.id);
            displayUserFragments(user);
          } catch (err) {
            console.error('Failed to delete fragment', { err });
          }
        }
      };

      fragmentList.appendChild(li);
    }
  } else {
    console.error('Fragments array is not available or is not an array.');
  }
}

function generateConversionButtons(fragment) {
  const conversionMap = {
    'text/plain': [],
    'text/markdown': ['html', 'txt'],
    'text/html': ['txt'],
    'text/csv': ['json', 'txt'],
    'application/json': ['yaml', 'yml', 'txt'],
    'application/yaml': ['txt'],
    'image/png': ['jpg', 'webp', 'gif', 'avif'],
    'image/jpeg': ['png', 'webp', 'gif', 'avif'],
    'image/webp': ['png', 'jpg', 'gif', 'avif'],
    'image/avif': ['png', 'jpg', 'webp', 'gif'],
    'image/gif': ['png', 'jpg', 'webp', 'avif'],
  };

  const supportedConversions = conversionMap[fragment.type] || [];

  const downloadButtons = fragment.type.startsWith('image/')
    ? supportedConversions
        .map(
          (ext) =>
            `<button class="convert-btn download-btn" data-id="${fragment.id}" data-extension="${ext}">Download as .${ext}</button>`
        )
        .join('')
    : '';

  const viewButtons = supportedConversions
    .map(
      (ext) =>
        `<button class="convert-btn view-btn" data-id="${fragment.id}" data-extension="${ext}">View as .${ext}</button>`
    )
    .join('');

  return `
    <div class="conversion-buttons">
      ${
        downloadButtons
          ? `<div class="download-options">
        <strong>Download the fragment in the following formats:</strong>
        ${downloadButtons}
      </div>`
          : ''
      }
      <div class="view-options">
        <strong>View this fragment in the following formats:</strong>
        ${viewButtons}
      </div>
    </div>
  `;
}

function escapeHTML(html) {
  const div = document.createElement('div');
  div.innerText = html;
  return div.innerHTML;
}

addEventListener('DOMContentLoaded', init);

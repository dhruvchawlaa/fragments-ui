// src/app.js

import { Auth, getUser } from './auth';
import { getUserFragments, createFragment, getFragmentById } from './api';

async function init() {
  const userSection = document.querySelector('#user');
  const loginBtn = document.querySelector('#login');
  const logoutBtn = document.querySelector('#logout');
  const fragmentForm = document.querySelector('#fragment-form');
  const fragmentText = document.querySelector('#fragment-text');
  const fragmentList = document.querySelector('#fragment-list');

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
      const newFragment = await createFragment(user, fragmentText.value);
      console.log('New Fragment:', newFragment);
      fragmentText.value = '';
      displayUserFragments(user);
    }
  };
}

async function displayUserFragments(user) {
  const userFragments = await getUserFragments(user);
  console.log(userFragments.fragments);

  if (userFragments.fragments) {
    const fragmentList = document.querySelector('#fragment-list');

    fragmentList.innerHTML = '';

    for (const fragment of userFragments.fragments) {
      try {
        const fragmentDetails = await getFragmentById(user, fragment);
        console.log(fragmentDetails);

        const li = document.createElement('li');
        li.textContent = fragmentDetails; // Assuming fragmentDetails has a `name` property
        fragmentList.appendChild(li);
      } catch (error) {
        console.error(`Failed to get details for fragment ${fragment.id}:`, error);
      }
    }
  } else {
    console.error('Fragments array is not available or is not an array.');
  }
}
addEventListener('DOMContentLoaded', init);

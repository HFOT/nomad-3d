// Injects the series switcher into a character page. The page itself is untouched.
import { SERIES } from './series.js';

const current = document.currentScript?.dataset.character
  || document.querySelector('script[data-character]')?.dataset.character;

const nav = document.createElement('nav');
nav.className = 'series-switcher';
nav.setAttribute('aria-label', 'キャラクターの切り替え');

const hub = document.createElement('a');
hub.className = 'series-hub';
hub.href = '../';
hub.title = '4体の一覧へ';
hub.innerHTML = '<i></i><span>SERIES</span>';
nav.append(hub);

for (const character of SERIES) {
  const link = document.createElement('a');
  link.className = 'series-link';
  link.href = `../${character.id}/`;
  link.style.setProperty('--accent', character.accent);
  link.innerHTML = `<b>${character.no}</b><span>${character.name}</span>`;
  if (character.id === current) {
    link.classList.add('active');
    link.setAttribute('aria-current', 'page');
    link.removeAttribute('href');
  }
  nav.append(link);
}

document.body.append(nav);

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './TournamentApp';
import { mountPublicShare } from './PublicShareApp';
import { initShareManager } from './share-manager';
import './styles.css';
import './score-modern.css';

const root=document.getElementById('root')!;
const isPublicShare=new URLSearchParams(window.location.search).has('share');

if(isPublicShare){
  mountPublicShare();
}else{
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  initShareManager();
}

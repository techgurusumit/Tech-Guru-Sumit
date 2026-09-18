import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './TournamentApp';
import { mountPublicShare } from './PublicShareApp';
import { initShareManager } from './share-manager';
import './styles.css';
import './score-modern.css';
import { TermsPage, PrivacyPage } from './LegalPages';

const root=document.getElementById('root')!;
const path=window.location.pathname;
const isPublicShare=new URLSearchParams(window.location.search).has('share');
const isTerms=path === '/terms' || path === '/terms/';
const isPrivacy=path === '/privacy' || path === '/privacy/';

if(isTerms){
  ReactDOM.createRoot(root).render(<TermsPage />);
}else if(isPrivacy){
  ReactDOM.createRoot(root).render(<PrivacyPage />);
}else if(isPublicShare){
  mountPublicShare();
}else{
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  initShareManager();
}

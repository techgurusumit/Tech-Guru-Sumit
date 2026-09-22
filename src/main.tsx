import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './TournamentApp';
import ResetPasswordPage from './ResetPasswordPage';
import { mountPublicShare } from './PublicShareApp';
import { initShareManager } from './share-manager';
import './styles.css';
import './score-modern.css';
import { TermsPage, PrivacyPage } from './LegalPages';
import { installPageUrlRouting } from './route-sync';

const root=document.getElementById('root')!;
const path=window.location.pathname;
const params=new URLSearchParams(window.location.search);
const isPublicShare=params.has('share');
const isRecovery=window.location.hash.includes('type=recovery')||params.get('type')==='recovery';
const isTerms=path === '/terms' || path === '/terms/';
const isPrivacy=path === '/privacy' || path === '/privacy/';

if(isTerms){
  ReactDOM.createRoot(root).render(<TermsPage />);
}else if(isPrivacy){
  ReactDOM.createRoot(root).render(<PrivacyPage />);
}else if(isRecovery){
  ReactDOM.createRoot(root).render(<React.StrictMode><ResetPasswordPage/></React.StrictMode>);
}else if(isPublicShare){
  mountPublicShare();
}else{
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  initShareManager();
  installPageUrlRouting();
}

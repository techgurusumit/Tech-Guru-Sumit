import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './TournamentApp';
import ManagerApp from './ManagerApp';
import ResetPasswordPage from './ResetPasswordPage';
import { mountPublicShare } from './PublicShareApp';
import { initShareManager } from './share-manager';
import './styles.css';
import './score-modern.css';
import { TermsPage, PrivacyPage } from './LegalPages';

const root=document.getElementById('root')!;
const path=window.location.pathname;
const params=new URLSearchParams(window.location.search);
const isPublicShare=params.has('share');
const isRecovery=window.location.hash.includes('type=recovery')||params.get('type')==='recovery';
const isTerms=path === '/terms' || path === '/terms/';
const isPrivacy=path === '/privacy' || path === '/privacy/';
const managerPaths=['/','/tournaments','/players','/fixtures','/scorecards','/reports','/games','/settings'];
const isManager=managerPaths.includes(path);

if(isTerms){
  ReactDOM.createRoot(root).render(<TermsPage />);
}else if(isPrivacy){
  ReactDOM.createRoot(root).render(<PrivacyPage />);
}else if(isRecovery){
  ReactDOM.createRoot(root).render(<React.StrictMode><ResetPasswordPage/></React.StrictMode>);
}else if(isPublicShare){
  mountPublicShare();
}else if(path==='/legacy'){
  ReactDOM.createRoot(root).render(<React.StrictMode><App/></React.StrictMode>);
  initShareManager();
}else if(isManager){
  ReactDOM.createRoot(root).render(<React.StrictMode><ManagerApp/></React.StrictMode>);
}else{
  ReactDOM.createRoot(root).render(<React.StrictMode><ManagerApp/></React.StrictMode>);
}

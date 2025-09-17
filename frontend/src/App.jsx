// src/App.jsx
import React, { useContext } from 'react';
import AuthForm from './components/AuthForm.jsx';
import { AuthContext } from './context/AuthContext.jsx';
import HomePage from './pages/HomePage.jsx';

function App() {
	const { user } = useContext(AuthContext);

	return <div>{user ? <HomePage /> : <AuthForm />}</div>;
}

export default App;

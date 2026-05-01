import React from 'react'
import { Outlet } from 'react-router-dom'
import styled from 'styled-components'
import './app.css'

export function App() {
  return (
    <AppContainer>
      <Outlet />
    </AppContainer>
  )
}

export default App

const AppContainer = styled.div`
  display: flex;
  width: 600px;
`

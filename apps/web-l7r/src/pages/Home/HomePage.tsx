import React from 'react'
import styled from 'styled-components'

export default function HomePage() {
  return (
    <Page>
      <Card>
        <Title>Accueil</Title>
        <Text>Bienvenue.</Text>
      </Card>
    </Page>
  )
}

const Page = styled.main`
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #f6f7fb;
`

const Card = styled.section`
  width: 100%;
  max-width: 360px;
  padding: 20px;
  border-radius: 10px;
  border: 1px solid #e5e7ef;
  background: #ffffff;
`

const Title = styled.h1`
  margin: 0;
  font-size: 1.6rem;
  color: #202432;
`

const Text = styled.p`
  margin: 8px 0 0;
  color: #4d5566;
`

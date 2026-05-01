import React, { useEffect, useState } from "react";
import styled from "styled-components";
import axios from "axios";

const API_URL = "https://l7r.fr/api/v1/diaries";

const StoreControl: React.FC = () => {
  const [storeStates, setStoreStates] = useState<{
    StoreSalon: string;
    StoreCuisine: string;
  }>({
    StoreSalon: "STOP",
    StoreCuisine: "STOP",
  });

  // Fonction pour récupérer l’état des stores
  const fetchStoreStates = async () => {
    try {
      const response = await axios.get(`${API_URL}/stores`);
      setStoreStates(response.data);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de l’état des stores",
        error,
      );
    }
  };

  // Charger l’état des stores au démarrage
  useEffect(() => {
    fetchStoreStates();
  }, []);

  const handleAction = async (
    store: "StoreSalon" | "StoreCuisine",
    action: "UP" | "DOWN" | "STOP",
  ) => {
    try {
      await axios.post(`${API_URL}/store/${store}/${action}`);
      alert(`${store} : commande ${action} envoyée.`);
      fetchStoreStates(); // Mettre à jour l’état après l’action
    } catch (error) {
      alert(`Erreur lors de l'envoi de la commande à ${store}`);
    }
  };

  return (
    <ControlContainer>
      <StoreContainer>
        <h3>Store Salon</h3>
        <StateText>État actuel : {storeStates.StoreSalon}</StateText>
        <Button onClick={() => handleAction("StoreSalon", "UP")}>Monter</Button>
        <Button onClick={() => handleAction("StoreSalon", "STOP")}>
          Stop/My
        </Button>
        <Button onClick={() => handleAction("StoreSalon", "DOWN")}>
          Descendre
        </Button>
      </StoreContainer>
      <StoreContainer>
        <h3>Store Cuisine</h3>
        <StateText>État actuel : {storeStates.StoreCuisine}</StateText>
        <Button onClick={() => handleAction("StoreCuisine", "UP")}>
          Monter
        </Button>
        <Button onClick={() => handleAction("StoreCuisine", "STOP")}>
          Stop/My
        </Button>
        <Button onClick={() => handleAction("StoreCuisine", "DOWN")}>
          Descendre
        </Button>
      </StoreContainer>
    </ControlContainer>
  );
};

const ControlContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 20px;
`;

const StoreContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;

  h3 {
    margin: 0;
  }
`;

const StateText = styled.p`
  font-size: 14px;
  font-weight: bold;
  color: #333;
`;

const Button = styled.button`
  padding: 10px 20px;
  cursor: pointer;
  font-size: 16px;
`;

export default StoreControl;

import styled from 'styled-components';

export const ModalDisplay = styled.div`
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1;
  padding: 16px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  max-width: 600px; 
`;

export const ModalDisplayTitle = styled.div`
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
`;

export const ModalEmpiriqueButtonValidation = styled.div`
  background-color: #f0f0f0;
  padding: 8px 16px;
  border-radius: 4px;
  margin-top: 16px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transform: perspective(1px) scale(1.02);
  transition: transform 0.3s ease;

  &:hover {
    transform: perspective(1px) scale(1.05);
  }
`;

export const ModalEmpiriqueButtonCancel = styled.div`
  background-color: #f0f0f0;
  padding: 8px 16px;
  border-radius: 4px;
  margin-top: 8px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transform: perspective(1px) scale(1.02);
  transition: transform 0.3s ease;

  &:hover {
    transform: perspective(1px) scale(1.05);
  }
`;


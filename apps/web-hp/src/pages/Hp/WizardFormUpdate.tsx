import React from "react";
import { useParams } from "react-router-dom";
import { WizardFormBase } from "./WizardFormBase";
import { Difficulty } from "../../domain/models/hp/Difficulty";
import { ApiL7RProvider } from "../../data/api/ApiL7RProvider";

export function WizardFormUpdate() {
  const { wizardName } = useParams<{ wizardName: string }>();

  async function handleUpdate(
    wizardData: Partial<{
      stats: { level: number; name: string }[];
      name: string;
      category: string;
      knowledges: { level: number; name: string }[];
      spells: { difficulty: Difficulty; name: string }[];
      text: string;
    }>,
  ) {
    try {
      // API call pour mettre à jour le wizard
      await ApiL7RProvider.updateWizard(wizardName ?? "", wizardData);
      alert("Wizard updated successfully!");
    } catch (error) {
      console.error("Error updating wizard:", error);
    }
  }

  return (
    <WizardFormBase
      wizardName={wizardName}
      isUpdating
      onSubmit={handleUpdate}
    />
  );
}

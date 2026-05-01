import { WizardFormBase } from "./WizardFormBase";
import { ApiL7RProvider } from "../../data/api/ApiL7RProvider";
import { Difficulty } from "../../domain/models/hp/Difficulty";

export function WizardFormCreate() {
  async function handleCreate(
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
      await ApiL7RProvider.createWizard(wizardData);
      alert("Wizard created successfully!");
    } catch (error) {
      console.error("Error creating wizard:", error);
    }
  }

  return <WizardFormBase onSubmit={handleCreate} />;
}

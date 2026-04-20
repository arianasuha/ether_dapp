import { postMission, fundMission } from '@/services/api';

export const handlePostMissionAction = async (prevState, formData) => {
  const category = formData.get('category');
  const maxBudget = formData.get('maxBudget');
  const region = formData.get('region');

  if (!category || !maxBudget || !region) {
    return { 
      success: false, 
      error: "Please fill in all mission parameters.",
      transactionHash: null
    };
  }

  if (isNaN(maxBudget) || parseFloat(maxBudget) <= 0) {
    return {
      success: false,
      error: "Maximum budget must be a valid number greater than 0.",
      transactionHash: null
    }
  }

  try {
    const result = await postMission(category, maxBudget, region);

    if (result.error) {
      return { 
        success: false, 
        error: result.error,
        transactionHash: null
      };
    }
    return {
      success: true,
      error: false,
      transactionHash: result.transactionHash
    };
  } catch (error) {
    console.error("Post Mission Action Error:", error);
    return { 
      success: false, 
      error: error.message || "The blockchain transaction failed. Please try again.",
      transactionHash: null
    };
  }
};

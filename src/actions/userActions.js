import { registerAccount } from '@/services/api';

export const handleRegisterAction = async (prevState, formData) => {
  const name = formData.get('name');
  const role = formData.get('role');

  if (!name || !role) {
    return { 
      success: false, 
      error: "All fields are required.",
      transactionHash: null
    };
  }
  
  try {
    const result = await registerAccount(name, role);

    if (result.error) {
      return { 
        success: false, 
        error: result.error,
        transactionHash: null
      };
    }
    return {
      success: result.success,
      error: false,
      transactionHash: result.transactionHash
    }
  } catch (error) {
    console.error("Action Error:", error);
    return { 
      success: false, 
      error: error.message || "Transaction failed.",
      transactionHash: null
    };
  }
};
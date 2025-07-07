// SubscriptionService.ts
import axios from 'axios';

const API_BASE_URL = 'https://api.plvcmonline.uk/api';  // Adjust based on your backend route

// Define types for Subscription and EmailList
export interface Subscription {
  id: number;
  full_name: string;
  email: string;
}

export interface EmailList {
  id: number;
  emails: string;
}

// Fetch all subscriptions
export const getSubscriptions = async (): Promise<Subscription[]> => {
  try {
    const response = await axios.get<Subscription[]>(`${API_BASE_URL}/subscriptions/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    throw error;
  }
};

// Fetch the email list (assuming only one email list with id=1)
export const getEmailList = async (): Promise<EmailList> => {
  try {
    const response = await axios.get<EmailList>(`${API_BASE_URL}/email-list/`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching email list:", error.response?.data?.detail || error.message);
    throw error;
  }
};


// Update the email list by adding new emails
export const updateEmailList = async (emails: string[]): Promise<void> => {
  try {
    const emailString = emails.join(';');
    await axios.post(`${API_BASE_URL}/email-list/`, { emails: emailString });
    console.log("Email list updated successfully.");
  } catch (error: any) {
    if (error.response && error.response.data) {
      console.error("Error updating email list:", error.response.data.detail || error.message);
    } else {
      console.error("An unknown error occurred while updating the email list.");
    }
    throw error;
  }
};


// Delete a subscription by ID
export const deleteSubscription = async (id: number): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/subscriptions/${id}/`);
    console.log(`Subscription with ID ${id} deleted successfully.`);
  } catch (error) {
    console.error("Error deleting subscription:", error);
    throw error;
  }
};

